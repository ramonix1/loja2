import type { FastifyReply, FastifyRequest } from 'fastify';

import { addItemSchema, updateItemSchema } from './cart.schema.js';
import {
  addCartItem,
  countCartItems,
  getCartItems,
  removeCartItem,
  updateCartItem,
} from './cart.service.js';

export async function getCartHandler(request: FastifyRequest, reply: FastifyReply) {
  const itens = await getCartItems(request.db, request.session.usuarioId!);
  const total = itens.reduce((s, i) => s + i.subtotal, 0);
  return reply.send({ data: { itens, total } });
}

export async function getCartCountHandler(request: FastifyRequest, reply: FastifyReply) {
  const contagem = await countCartItems(request.db, request.session.usuarioId!);
  return reply.send({ data: { contagem } });
}

export async function addCartItemHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = addItemSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const result = await addCartItem(
    request.db,
    request.session.usuarioId!,
    parsed.data.produto_id,
    parsed.data.quantidade ?? 1,
  );

  if ('error' in result) {
    return reply.code(result.status).send({ error: result.error, code: result.code });
  }

  return reply.send({ data: result });
}

export async function updateCartItemHandler(request: FastifyRequest, reply: FastifyReply) {
  const id = Number((request.params as { id: string }).id);
  const parsed = updateItemSchema.safeParse(request.body);
  if (!Number.isInteger(id) || id < 1 || !parsed.success) {
    return reply.code(400).send({ error: 'Dados inválidos.', code: 'VALIDATION_ERROR' });
  }

  const data = await updateCartItem(
    request.db,
    request.session.usuarioId!,
    id,
    parsed.data.quantidade,
  );
  return reply.send({ data });
}

export async function removeCartItemHandler(request: FastifyRequest, reply: FastifyReply) {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  const data = await removeCartItem(request.db, request.session.usuarioId!, id);
  return reply.send({ data });
}
