import type { FastifyInstance } from 'fastify';

import { adminRoutes } from '../modules/admin/admin.routes.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { tenantRoutes } from '../modules/tenant/tenant.routes.js';
import { tenantPreHandler } from '../plugins/tenant.js';

/**
 * Agrupa as rotas `/api/v1`. O `tenantPreHandler` roda antes de toda rota deste
 * escopo (após o load de sessão, que é global), injetando `request.db`.
 */
export async function v1Routes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', tenantPreHandler);

  await app.register(authRoutes);
  await app.register(tenantRoutes);
  await app.register(adminRoutes);
}
