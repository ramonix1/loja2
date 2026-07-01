import type { FastifyReply, FastifyRequest } from 'fastify';

import { listBuyerOrders } from './orders.service.js';

export async function listBuyerOrdersHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const data = await listBuyerOrders(request.db, request.session.usuarioId!);
  return reply.send({ data });
}
