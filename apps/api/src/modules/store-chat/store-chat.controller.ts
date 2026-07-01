import type { FastifyReply, FastifyRequest } from 'fastify';

import { messageSchema } from './store-chat.schema.js';
import { sendStoreMessage } from './store-chat.service.js';

export async function sendStoreMessageHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = messageSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const sessionId = `user-${request.session.usuarioId}`;
  const result = await sendStoreMessage(request.db, {
    sessionId,
    usuarioId: request.session.usuarioId,
    nome: parsed.data.nome ?? request.session.nome ?? undefined,
    conversaId: parsed.data.conversa_id,
    conteudo: parsed.data.conteudo,
  });

  return reply.code(201).send({ data: result });
}
