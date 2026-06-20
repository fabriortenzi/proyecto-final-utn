import { Router } from 'express';
import {
  sanitizedWebAuthnInput,
  generateRegistrationOptionsHandler,
  verifyRegistrationHandler,
  generateAuthenticationOptionsHandler,
  verifyAuthenticationHandler,
} from './webauthn.controller.js';
import { assureAuthAndRoles, UserTypeEnum } from '../shared/auth.middleware.js';

export const webauthnRouter = Router();

webauthnRouter.post(
  '/register/begin',
  assureAuthAndRoles([UserTypeEnum.client, UserTypeEnum.admin, UserTypeEnum.delivery, UserTypeEnum.owner]),
  generateRegistrationOptionsHandler
);

webauthnRouter.post(
  '/register/complete',
  assureAuthAndRoles([UserTypeEnum.client, UserTypeEnum.admin, UserTypeEnum.delivery, UserTypeEnum.owner]),
  verifyRegistrationHandler
);

webauthnRouter.post('/authenticate/begin', sanitizedWebAuthnInput, generateAuthenticationOptionsHandler);
webauthnRouter.post('/authenticate/complete', sanitizedWebAuthnInput, verifyAuthenticationHandler);
