import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { requireAuth } from '../../plugins/auth-guard.js';
import { getCheckoutPreview, getCheckoutResult, processCheckout } from './checkout.service.js';

const checkoutSchema = z.object({
  nome_entrega: z.string().min(3),
  email_entrega: z.string().email(),
  telefone_entrega: z.string().optional(),
  cpf_entrega: z.string().optional(),
  cep: z.string().min(8),
  logradouro: z.string().min(3),
  numero: z.string().min(1),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().min(2),
  estado: z.string().length(2),
  metodo_pagamento: z.enum(['pix', 'boleto', 'cartao', 'sumup_online', 'teste']),
  data_evento: z.string().optional(),
  stripe_payment_method_id: z.string().optional(),
  frete_valor: z.number().min(0).optional(),
  frete_servico: z.string().optional(),
});

export async function checkoutRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/checkout', async (request, reply) => {
    const data = await getCheckoutPreview(request.db, request.session.usuarioId!);
    if (data.itens.length === 0) {
      return reply.code(400).send({ error: 'Carrinho vazio.', code: 'EMPTY_CART' });
    }
    return reply.send({ data });
  });

  app.post('/checkout', async (request, reply) => {
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
  });

  app.get('/checkout/:id/result', async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id) || id < 1) {
      return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
    }

    const data = await getCheckoutResult(request.db, request.session.usuarioId!, id);
    if (!data) {
      return reply.code(404).send({ error: 'Pedido não encontrado.', code: 'NOT_FOUND' });
    }

    return reply.send({ data });
  });
}
