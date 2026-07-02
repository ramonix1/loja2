import type { FastifyInstance } from 'fastify';

import { requireStoreScope } from '../../lib/store-scope.js';
import { requireAuth } from '../../plugins/auth-guard.js';
import { listBuyerOrders } from './orders.service.js';

export async function ordersRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/orders', async (request, reply) => {
    const data = await listBuyerOrders(requireStoreScope(request), request.session.usuarioId!);
    return reply.send({ data });
  });
}
