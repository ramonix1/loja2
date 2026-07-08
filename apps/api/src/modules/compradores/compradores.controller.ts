import { listCompradoresQuerySchema } from '@lojao/types/compradores';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { requireStoreScope } from '../../lib/store-scope.js';
import { getComprador, listCompradores } from './compradores.service.js';

export async function getCompradores(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = listCompradoresQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Parâmetros inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { compradores, totais } = await listCompradores(requireStoreScope(request), parsed.data);
  return reply.send({
    data: compradores,
    meta: { totais, busca: parsed.data.busca ?? '' },
  });
}

export async function getCompradorById(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  const data = await getComprador(requireStoreScope(request), id);
  if (!data) {
    return reply.code(404).send({ error: 'Comprador não encontrado.', code: 'NOT_FOUND' });
  }

  return reply.send({ data });
}
