import type { FastifyInstance } from 'fastify';

import { requireAccountSession, requireMerchantMember } from '../../plugins/auth-guard.js';
import {
  getMe,
  getMyStores,
  getResetPasswordToken,
  postClearStore,
  postLogin,
  postLogout,
  postRecoverPassword,
  postRegister,
  postResetPassword,
  postSelectStore,
} from './auth.controller.js';

export async function authRouter(app: FastifyInstance): Promise<void> {
  app.post('/auth/login', postLogin);
  app.get('/auth/my-stores', { preHandler: requireAccountSession }, getMyStores);
  app.post('/auth/select-store', { preHandler: requireMerchantMember }, postSelectStore);
  app.post('/auth/clear-store', { preHandler: requireMerchantMember }, postClearStore);
  app.post('/auth/register', postRegister);
  app.post('/auth/recover-password', postRecoverPassword);
  app.get('/auth/reset-password/:token', getResetPasswordToken);
  app.post('/auth/reset-password/:token', postResetPassword);
  app.post('/auth/logout', postLogout);
  app.get('/auth/me', getMe);
}
