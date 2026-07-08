import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import {
  getDashboardChartsHandler,
  getDashboardStatsHandler,
  getPedido,
  getPedidos,
  patchPedidoStatus,
} from './admin.controller.js';

export async function adminRouter(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/dashboard/stats', getDashboardStatsHandler);
  app.get('/admin/dashboard/charts', getDashboardChartsHandler);
  app.get('/admin/pedidos', getPedidos);
  app.get('/admin/pedidos/:id', getPedido);
  app.patch('/admin/pedidos/:id/status', patchPedidoStatus);
}
