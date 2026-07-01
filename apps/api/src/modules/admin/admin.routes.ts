import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import {
  getDashboardChartsHandler,
  getDashboardStatsHandler,
  getPedidoByIdHandler,
  listPedidosHandler,
  updatePedidoStatusHandler,
} from './admin.controller.js';

/**
 * Rotas admin (read-only na Fase 2). Todas exigem sessão admin (`requireAdmin`)
 * e tenant resolvido (preHandler de tenant herdado do escopo `/api/v1`).
 */
export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/dashboard/stats', getDashboardStatsHandler);
  app.get('/admin/dashboard/charts', getDashboardChartsHandler);
  app.get('/admin/pedidos', listPedidosHandler);
  app.get('/admin/pedidos/:id', getPedidoByIdHandler);
  app.patch('/admin/pedidos/:id/status', updatePedidoStatusHandler);
}
