import type { FastifyReply, FastifyRequest } from 'fastify';

import { requireStoreScope } from '../../lib/store-scope.js';
import { findStoreConfig } from './store.repository.js';

export async function getStoreConfig(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const data = await findStoreConfig(requireStoreScope(request));
  return reply.send({ data });
}
