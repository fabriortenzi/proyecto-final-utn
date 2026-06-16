import { Router } from 'express';
import { createPreference } from './mercadopago.controller.js';
import { assureAuthAndRoles, UserTypeEnum } from '../shared/auth.middleware.js';

export const mercadopagoRouter = Router();

mercadopagoRouter.post(
  '/create-preference',
  assureAuthAndRoles([UserTypeEnum.admin, UserTypeEnum.client]),
  createPreference
);
