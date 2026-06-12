import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import { pedidosQuerySchema } from './admin.schemas.js';
import { getDashboardStats, listPedidos } from './admin.service.js';

/**
 * Rotas admin (read-only na Fase 2). Todas exigem sessão admin (`requireAdmin`)
 * e tenant resolvido (preHandler de tenant herdado do escopo `/api/v1`).
 */
export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/dashboard/stats', async (request, reply) => {
    const data = await getDashboardStats(request.db);
    return reply.send({ data });
  });

  app.get('/admin/pedidos', async (request, reply) => {
    const parsed = pedidosQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Parâmetros inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { page, perPage, status } = parsed.data;
    const { data, total } = await listPedidos(request.db, parsed.data);

    return reply.send({ data, meta: { page, perPage, total, ...(status ? { status } : {}) } });
  });
}
