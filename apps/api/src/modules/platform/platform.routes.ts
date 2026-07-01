import type { FastifyInstance } from 'fastify';

import { requirePlatformAdmin } from '../../plugins/auth-guard.js';
import {
  createTenantHandler,
  getTenantHandler,
  listTenantsHandler,
  platformLoginHandler,
  updateTenantHandler,
} from './platform.controller.js';

/**
 * Rotas do Platform Hub (`/api/v1/platform/*`). Operam no banco master e não
 * dependem de tenant resolvido (o hook de `/api/v1` ignora tenant aqui).
 *
 * `POST /platform/login` autentica o operador via `MASTER_EMAIL`/`MASTER_PASSWORD`.
 * Demais rotas exigem `role === 'platform_admin'` (`requirePlatformAdmin`).
 */
export async function platformRoutes(app: FastifyInstance): Promise<void> {
  app.post('/platform/login', platformLoginHandler);

  app.register(async (scoped) => {
    scoped.addHook('preHandler', requirePlatformAdmin);

    scoped.get('/platform/tenants', listTenantsHandler);
    scoped.post('/platform/tenants', createTenantHandler);
    scoped.get('/platform/tenants/:slug', getTenantHandler);
    scoped.patch('/platform/tenants/:slug', updateTenantHandler);
  });
}
