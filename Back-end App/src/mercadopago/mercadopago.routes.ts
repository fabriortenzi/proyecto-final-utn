import { Router } from 'express';
import { createPreference, createPreferenceFromData } from './mercadopago.controller.js';
import { assureAuthAndRoles, UserTypeEnum } from '../shared/auth.middleware.js';

export const mercadopagoRouter = Router();

mercadopagoRouter.post(
  '/create-preference',
  assureAuthAndRoles([UserTypeEnum.admin, UserTypeEnum.client]),
  createPreference
);

mercadopagoRouter.post(
  '/create-preference-from-data',
  assureAuthAndRoles([UserTypeEnum.admin, UserTypeEnum.client]),
  createPreferenceFromData
);
