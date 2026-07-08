import { updateConfiguracoesSchema } from '@lojao/types/configuracoes';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { requireStoreScope } from '../../lib/store-scope.js';
import { getConfiguracoes, updateConfiguracoes } from './configuracoes.service.js';

export async function getConfiguracoesHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const data = await getConfiguracoes(requireStoreScope(request));
  return reply.send({ data });
}

export async function updateConfiguracoesHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = updateConfiguracoesSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const data = await updateConfiguracoes(requireStoreScope(request), parsed.data);
  return reply.send({ data });
}
