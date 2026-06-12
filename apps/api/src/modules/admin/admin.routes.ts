import { dashboardChartsQuerySchema } from '@lojao/types/dashboard';
import { updatePedidoStatusSchema } from '@lojao/types/pedidos';
import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import { getDashboardCharts } from './dashboard-charts.service.js';
import { pedidosQuerySchema } from './admin.schemas.js';
import { getDashboardStats, getPedidoById, listPedidos, updatePedidoStatus } from './admin.service.js';

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

  app.get('/admin/dashboard/charts', async (request, reply) => {
    const parsed = dashboardChartsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Parâmetros inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const data = await getDashboardCharts(request.db, parsed.data.periodo);
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

  app.get('/admin/pedidos/:id', async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id) || id < 1) {
      return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
    }

    const data = await getPedidoById(request.db, id);
    if (!data) {
      return reply.code(404).send({ error: 'Pedido não encontrado.', code: 'NOT_FOUND' });
    }

    return reply.send({ data });
  });

  app.patch('/admin/pedidos/:id/status', async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id) || id < 1) {
      return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
    }

    const parsed = updatePedidoStatusSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Dados inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const data = await updatePedidoStatus(request.db, id, parsed.data);
    if (!data) {
      return reply.code(404).send({ error: 'Pedido não encontrado.', code: 'NOT_FOUND' });
    }

    return reply.send({ data });
  });
}
