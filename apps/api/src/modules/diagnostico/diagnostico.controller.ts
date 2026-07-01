import type { FastifyReply, FastifyRequest } from 'fastify';

import { runDiagnostico } from './diagnostico.service.js';

export async function getDiagnosticoHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const resultados = await runDiagnostico();
  return reply.send({ data: { resultados } });
}
