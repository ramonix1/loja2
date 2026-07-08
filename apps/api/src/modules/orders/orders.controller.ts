import type { FastifyReply, FastifyRequest } from 'fastify';

import { requireStoreScope } from '../../lib/store-scope.js';
import { listBuyerOrders } from './orders.service.js';

export async function getOrders(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const data = await listBuyerOrders(requireStoreScope(request), request.session.usuarioId!);
  return reply.send({ data });
}
