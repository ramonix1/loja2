import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { requireAuth } from '../../plugins/auth-guard.js';
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

export async function cartRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/cart', async (request, reply) => {
    const itens = await getCartItems(request.db, request.session.usuarioId!);
    const total = itens.reduce((s, i) => s + i.subtotal, 0);
    return reply.send({ data: { itens, total } });
  });

  app.get('/cart/count', async (request, reply) => {
    const contagem = await countCartItems(request.db, request.session.usuarioId!);
    return reply.send({ data: { contagem } });
  });

  app.post('/cart/items', async (request, reply) => {
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
  });

  app.patch('/cart/items/:id', async (request, reply) => {
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
  });

  app.delete('/cart/items/:id', async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id) || id < 1) {
      return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
    }

    const data = await removeCartItem(request.db, request.session.usuarioId!, id);
    return reply.send({ data });
  });
}
