import { orm } from "../shared/orm.js";
import { Request, Response, NextFunction } from "express";
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { User } from "../user/user.entity.js";
import { Authenticator } from "./webauthn.entity.js";
import jwt from "jsonwebtoken";
import { secret } from "../shared/auth.middleware.js";
import crypto from 'crypto';

const em = orm.em;

const rpName = 'DeliverIt';
const rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
const expectedOrigin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:4200';

const authChallengeStore = new Map<string, string>();

setInterval(() => authChallengeStore.clear(), 300000);

export function sanitizedWebAuthnInput(req: Request, _: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    email: req.body.email,
    challengeId: req.body.challengeId,
    response: req.body.response,
    name: req.body.name,
  };

  Object.keys(req.body.sanitizedInput).forEach(key => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key];
    }
  });

  next();
}

export async function generateRegistrationOptionsHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).token.id;
    const user = await em.findOneOrFail(User, userId, { populate: ['authenticators'] });

    const authenticators = user.authenticators?.getItems() || [];

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: user.email,
      userID: new TextEncoder().encode(user.id),
      userDisplayName: `${user.name} ${user.surname}`,
      excludeCredentials: authenticators.map(auth => ({
        id: auth.credentialID,
        transports: auth.transports as any[],
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    user.webauthnChallenge = options.challenge;
    await em.flush();

    res.json(options);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function verifyRegistrationHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).token.id;
    const user = await em.findOneOrFail(User, userId);

    const expectedChallenge = user.webauthnChallenge;
    if (!expectedChallenge) {
      return res.status(400).json({ message: 'No registration challenge found' });
    }

    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      user.webauthnChallenge = '';
      await em.flush();
      return res.json({ verified: false });
    }

    const { registrationInfo } = verification;

    const authenticator = em.create(Authenticator, {
      credentialID: registrationInfo.credential.id,
      credentialPublicKey: isoBase64URL.fromBuffer(registrationInfo.credential.publicKey),
      counter: registrationInfo.credential.counter,
      credentialDeviceType: registrationInfo.credentialDeviceType,
      credentialBackedUp: registrationInfo.credentialBackedUp,
      transports: req.body.response?.transports || [],
      user,
    });

    user.webauthnChallenge = '';
    await em.flush();

    res.json({
      verified: true,
      authenticator: {
        id: authenticator.id,
        transports: authenticator.transports,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function generateAuthenticationOptionsHandler(req: Request, res: Response) {
  try {
    const email = req.body.sanitizedInput?.email;

    let allowCredentials: { id: string; transports: any[] }[] = [];

    if (email) {
      const user = await em.findOne(User, { email }, { populate: ['authenticators'] });
      if (user) {
        const authenticators = user.authenticators?.getItems() || [];
        allowCredentials = authenticators.map(auth => ({
          id: auth.credentialID,
          transports: auth.transports as any[],
        }));
      }
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
      userVerification: 'preferred',
    });

    const challengeId = crypto.randomUUID();
    authChallengeStore.set(challengeId, options.challenge);

    res.json({ options, challengeId });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function verifyAuthenticationHandler(req: Request, res: Response) {
  try {
    const challengeId = req.body.sanitizedInput?.challengeId;
    const response = req.body.sanitizedInput?.response;

    if (!challengeId || !response) {
      return res.status(400).json({ message: 'Missing challengeId or response' });
    }

    const expectedChallenge = authChallengeStore.get(challengeId);
    if (!expectedChallenge) {
      return res.status(400).json({ message: 'Challenge not found or expired' });
    }
    authChallengeStore.delete(challengeId);

    const credentialId = response.id;
    const authenticator = await em.findOne(Authenticator, { credentialID: credentialId }, { populate: ['user'] });
    if (!authenticator) {
      return res.status(400).json({ verified: false, message: 'Authenticator not found' });
    }

    const user = authenticator.user;

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      credential: {
        id: authenticator.credentialID,
        publicKey: isoBase64URL.toBuffer(authenticator.credentialPublicKey),
        counter: authenticator.counter,
        transports: authenticator.transports as any[],
      },
    });

    if (!verification.verified) {
      return res.json({ verified: false });
    }

    authenticator.counter = verification.authenticationInfo.newCounter;

    const fullUser = await em.findOne(User, user.id, { populate: ['userType'] });
    if (!fullUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = jwt.sign(
      { id: fullUser.id, name: fullUser.name, surname: fullUser.surname, userType: fullUser.userType },
      secret
    );

    await em.flush();

    res.json({
      verified: true,
      token,
      user: fullUser,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
