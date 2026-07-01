import type { FastifyInstance } from 'fastify';

import { requireMerchantAdmin } from '../../plugins/auth-guard.js';
import {
  clearTenantHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  myStoresHandler,
  recoverPasswordHandler,
  registerHandler,
  resetPasswordHandler,
  selectTenantHandler,
  validateResetTokenHandler,
} from './auth.controller.js';

/**
 * Rotas de autenticação. Espelham os campos de sessão de
 * `authController.processarLogin`/`logout` para manter compatibilidade com o
 * legacy (mesmo cookie `lojao.sid`).
 */
export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/login', loginHandler);
  app.post('/auth/select-tenant', { preHandler: requireMerchantAdmin }, selectTenantHandler);
  app.get('/auth/my-stores', { preHandler: requireMerchantAdmin }, myStoresHandler);
  app.post('/auth/clear-tenant', { preHandler: requireMerchantAdmin }, clearTenantHandler);
  app.post('/auth/register', registerHandler);
  app.post('/auth/recover-password', recoverPasswordHandler);
  app.get('/auth/reset-password/:token', validateResetTokenHandler);
  app.post('/auth/reset-password/:token', resetPasswordHandler);
  app.post('/auth/logout', logoutHandler);
  app.get('/auth/me', meHandler);
}
