import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../../plugins/auth-guard.js';
import { listBuyerOrdersHandler } from './orders.controller.js';

export async function ordersRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/orders', listBuyerOrdersHandler);
}
