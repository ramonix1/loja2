import type { FastifyInstance } from 'fastify';

import { getTenantConfigHandler } from './tenant.controller.js';

/**
 * Rotas de tenant. `GET /tenant/config` expõe a identidade visual da loja
 * (configs `loja_*`), espelhando o `res.locals.loja` do legacy.
 */
export async function tenantRoutes(app: FastifyInstance): Promise<void> {
  app.get('/tenant/config', getTenantConfigHandler);
}
