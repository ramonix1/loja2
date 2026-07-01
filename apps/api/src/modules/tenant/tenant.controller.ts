import type { FastifyReply, FastifyRequest } from 'fastify';

import { getTenantConfig } from './tenant.service.js';

export async function getTenantConfigHandler(request: FastifyRequest, reply: FastifyReply) {
  const data = await getTenantConfig(request.db);
  return reply.send({ data });
}
