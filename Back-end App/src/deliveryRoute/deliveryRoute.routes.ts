import { Router } from 'express';
import {
  sanitizeRouteInput,
  requestRoute,
  confirmRoute,
  completeStop,
  rejectRoute,
} from './deliveryRoute.controller.js';
import { assureAuthAndRoles, UserTypeEnum } from '../shared/auth.middleware.js';

export const deliveryRouteRouter = Router();

deliveryRouteRouter.post(
  '/request',
  assureAuthAndRoles([UserTypeEnum.delivery]),
  sanitizeRouteInput,
  requestRoute
);

deliveryRouteRouter.post(
  '/:id/confirm',
  assureAuthAndRoles([UserTypeEnum.delivery]),
  confirmRoute
);

deliveryRouteRouter.put(
  '/:id/stops/:stopIndex/complete',
  assureAuthAndRoles([UserTypeEnum.delivery]),
  completeStop
);

deliveryRouteRouter.post(
  '/:id/reject',
  assureAuthAndRoles([UserTypeEnum.delivery]),
  rejectRoute
);
