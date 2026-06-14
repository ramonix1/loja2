import { createBotRespostaSchema, updateBotRespostaSchema } from '@lojao/types/chat';
import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import {
  createBotResposta,
  deleteBotResposta,
  getMensagensConversa,
  listBotRespostas,
  listConversas,
  updateBotResposta,
} from './chat.service.js';

export async function chatRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/chat/conversas', async (request, reply) => {
    const data = await listConversas(request.db);
    return reply.send({ data });
  });

  app.get('/admin/chat/conversas/:id/mensagens', async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id) || id < 1) {
      return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
    }

    const data = await getMensagensConversa(request.db, id);
    if (!data) {
      return reply.code(404).send({ error: 'Conversa não encontrada.', code: 'NOT_FOUND' });
    }

    return reply.send({ data });
  });

  app.get('/admin/chat/bot-respostas', async (request, reply) => {
    const data = await listBotRespostas(request.db);
    return reply.send({ data });
  });

  app.post('/admin/chat/bot-respostas', async (request, reply) => {
    const parsed = createBotRespostaSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Dados inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const data = await createBotResposta(request.db, parsed.data);
    return reply.code(201).send({ data });
  });

  app.put('/admin/chat/bot-respostas/:id', async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id) || id < 1) {
      return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
    }

    const parsed = updateBotRespostaSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Dados inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const data = await updateBotResposta(request.db, id, parsed.data);
    if (!data) {
      return reply.code(404).send({ error: 'Resposta não encontrada.', code: 'NOT_FOUND' });
    }

    return reply.send({ data });
  });

  app.delete('/admin/chat/bot-respostas/:id', async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id) || id < 1) {
      return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
    }

    const removed = await deleteBotResposta(request.db, id);
    if (!removed) {
      return reply.code(404).send({ error: 'Resposta não encontrada.', code: 'NOT_FOUND' });
    }

    return reply.send({ data: { ok: true } });
  });
}
