import type { FastifyReply, FastifyRequest } from 'fastify';

import { checkoutSchema } from './checkout.schema.js';
import { getCheckoutPreview, getCheckoutResult, processCheckout } from './checkout.service.js';

export async function getCheckoutPreviewHandler(request: FastifyRequest, reply: FastifyReply) {
  const data = await getCheckoutPreview(request.db, request.session.usuarioId!);
  if (data.itens.length === 0) {
    return reply.code(400).send({ error: 'Carrinho vazio.', code: 'EMPTY_CART' });
  }
  return reply.send({ data });
}

export async function processCheckoutHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = checkoutSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const result = await processCheckout(
    request.db,
    request.session.usuarioId!,
    request.tenantId,
    parsed.data,
  );

  if (!result.ok) {
    return reply.code(result.status).send({ error: result.error, code: result.code });
  }

  return reply.code(201).send({
    data: {
      pedido_id: result.pedido_id,
      status: result.status,
      redirect_url: result.redirect_url,
    },
  });
}

export async function getCheckoutResultHandler(request: FastifyRequest, reply: FastifyReply) {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  const data = await getCheckoutResult(request.db, request.session.usuarioId!, id);
  if (!data) {
    return reply.code(404).send({ error: 'Pedido não encontrado.', code: 'NOT_FOUND' });
  }

  return reply.send({ data });
}
