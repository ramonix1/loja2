import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../../plugins/auth-guard.js';
import { sendStoreMessageHandler } from './store-chat.controller.js';

/** REST complementar ao Socket.io — chat da vitrine/comprador. */
export async function storeChatRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.post('/chat/mensagens', sendStoreMessageHandler);
}
