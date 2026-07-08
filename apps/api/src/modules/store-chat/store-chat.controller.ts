import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { requireStoreScope } from '../../lib/store-scope.js';
import { sendStoreMessage } from './store-chat.service.js';

const messageSchema = z.object({
  conteudo: z.string().min(1).max(2000),
  conversa_id: z.number().int().positive().optional(),
  nome: z.string().max(100).optional(),
});

export async function postMensagem(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = messageSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const sessionId = `user-${request.session.usuarioId}`;
  const result = await sendStoreMessage(requireStoreScope(request), {
    sessionId,
    usuarioId: request.session.usuarioId,
    nome: parsed.data.nome ?? request.session.nome ?? undefined,
    conversaId: parsed.data.conversa_id,
    conteudo: parsed.data.conteudo,
  });

  return reply.code(201).send({ data: result });
}
