import { createBotRespostaSchema, updateBotRespostaSchema } from '@lojao/types/chat';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { requireStoreScope } from '../../lib/store-scope.js';
import {
  createBotResposta,
  deleteBotResposta,
  getMensagensConversa,
  listBotRespostas,
  listConversas,
  updateBotResposta,
} from './chat.service.js';

export async function getConversas(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const data = await listConversas(requireStoreScope(request));
  return reply.send({ data });
}

export async function getMensagens(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  const data = await getMensagensConversa(requireStoreScope(request), id);
  if (!data) {
    return reply.code(404).send({ error: 'Conversa não encontrada.', code: 'NOT_FOUND' });
  }

  return reply.send({ data });
}

export async function getBotRespostas(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const data = await listBotRespostas(requireStoreScope(request));
  return reply.send({ data });
}

export async function createBotRespostaHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = createBotRespostaSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const data = await createBotResposta(requireStoreScope(request), parsed.data);
  return reply.code(201).send({ data });
}

export async function updateBotRespostaHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
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

  const data = await updateBotResposta(requireStoreScope(request), id, parsed.data);
  if (!data) {
    return reply.code(404).send({ error: 'Resposta não encontrada.', code: 'NOT_FOUND' });
  }

  return reply.send({ data });
}

export async function deleteBotRespostaHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  const removed = await deleteBotResposta(requireStoreScope(request), id);
  if (!removed) {
    return reply.code(404).send({ error: 'Resposta não encontrada.', code: 'NOT_FOUND' });
  }

  return reply.send({ data: { ok: true } });
}
