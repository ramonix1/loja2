import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { requireStoreScope } from '../../lib/store-scope.js';
import {
  addCartItem,
  countCartItems,
  getCartItems,
  removeCartItem,
  updateCartItem,
} from './cart.service.js';

const addItemSchema = z.object({
  produto_id: z.number().int().positive(),
  quantidade: z.number().int().positive().optional(),
});

const updateItemSchema = z.object({
  quantidade: z.number().int().min(0),
});

export async function getCart(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const scope = requireStoreScope(request);
  const buyerId = request.session.usuarioId!;
  const itens = await getCartItems(scope, buyerId);
  const total = itens.reduce((s, i) => s + i.subtotal, 0);
  return reply.send({ data: { itens, total } });
}

export async function getCartCount(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const scope = requireStoreScope(request);
  const count = await countCartItems(scope, request.session.usuarioId!);
  return reply.send({ data: { count } });
}

export async function addItem(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = addItemSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const result = await addCartItem(
    requireStoreScope(request),
    request.session.usuarioId!,
    parsed.data.produto_id,
    parsed.data.quantidade ?? 1,
  );

  if ('error' in result) {
    return reply.code(result.status).send({ error: result.error, code: result.code });
  }

  return reply.send({ data: result });
}

export async function updateItem(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const id = Number((request.params as { id: string }).id);
  const parsed = updateItemSchema.safeParse(request.body);
  if (!Number.isInteger(id) || id < 1 || !parsed.success) {
    return reply.code(400).send({ error: 'Dados inválidos.', code: 'VALIDATION_ERROR' });
  }

  const data = await updateCartItem(
    requireStoreScope(request),
    request.session.usuarioId!,
    id,
    parsed.data.quantidade,
  );
  return reply.send({ data });
}

export async function removeItem(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  const data = await removeCartItem(requireStoreScope(request), request.session.usuarioId!, id);
  return reply.send({ data });
}
