import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import {
  createBotRespostaHandler,
  deleteBotRespostaHandler,
  getMensagensConversaHandler,
  listBotRespostasHandler,
  listConversasHandler,
  updateBotRespostaHandler,
} from './chat.controller.js';

export async function chatRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/chat/conversas', listConversasHandler);
  app.get('/admin/chat/conversas/:id/mensagens', getMensagensConversaHandler);
  app.get('/admin/chat/bot-respostas', listBotRespostasHandler);
  app.post('/admin/chat/bot-respostas', createBotRespostaHandler);
  app.put('/admin/chat/bot-respostas/:id', updateBotRespostaHandler);
  app.delete('/admin/chat/bot-respostas/:id', deleteBotRespostaHandler);
}
