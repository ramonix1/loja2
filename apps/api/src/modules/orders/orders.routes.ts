import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../../plugins/auth-guard.js';
import { listBuyerOrders } from './orders.service.js';

export async function ordersRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/orders', async (request, reply) => {
    const data = await listBuyerOrders(request.db, request.session.usuarioId!);
    return reply.send({ data });
  });
}
