import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../../plugins/auth-guard.js';
import { postMensagem } from './store-chat.controller.js';

export async function storeChatRouter(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.post('/chat/mensagens', postMensagem);
}
