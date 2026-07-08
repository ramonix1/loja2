import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../../plugins/auth-guard.js';
import { getOrders } from './orders.controller.js';

export async function ordersRouter(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/orders', getOrders);
}
