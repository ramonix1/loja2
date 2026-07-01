import type { FastifyReply, FastifyRequest } from 'fastify';

import { calculateSchema } from './shipping.schema.js';
import { calculateShipping } from './shipping.service.js';

export async function calculateShippingHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = calculateSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const opcoes = await calculateShipping(
      request.db,
      parsed.data.cep_destino,
      parsed.data.subtotal ?? 0,
    );
    return reply.send({ data: { opcoes } });
  } catch (err) {
    return reply.code(400).send({
      error: err instanceof Error ? err.message : 'Erro ao calcular frete.',
      code: 'SHIPPING_ERROR',
    });
  }
}
