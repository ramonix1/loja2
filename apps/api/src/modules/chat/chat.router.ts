import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import {
  createBotRespostaHandler,
  deleteBotRespostaHandler,
  getBotRespostas,
  getConversas,
  getMensagens,
  updateBotRespostaHandler,
} from './chat.controller.js';

export async function chatRouter(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/chat/conversas', getConversas);
  app.get('/admin/chat/conversas/:id/mensagens', getMensagens);
  app.get('/admin/chat/bot-respostas', getBotRespostas);
  app.post('/admin/chat/bot-respostas', createBotRespostaHandler);
  app.put('/admin/chat/bot-respostas/:id', updateBotRespostaHandler);
  app.delete('/admin/chat/bot-respostas/:id', deleteBotRespostaHandler);
}
