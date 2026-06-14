import type { FastifyInstance } from 'fastify';

import { getTestProdutoId } from '../helpers/fixture-ids.js';
import { loginUserCookie, TENANT_HEADER } from '../helpers/session.js';

export const CHECKOUT_ADDRESS = {
  nome_entrega: 'Comprador Teste',
  email_entrega: 'comprador-test@loja.com',
  telefone_entrega: '11999999999',
  cpf_entrega: '52998224725',
  cep: '01310-100',
  logradouro: 'Av Paulista',
  numero: '1000',
  complemento: 'Apto 1',
  bairro: 'Bela Vista',
  cidade: 'São Paulo',
  estado: 'SP',
  frete_valor: 0,
  frete_servico: 'gratis',
};

/** Limpa carrinho do usuário autenticado (evita poluição entre testes). */
export async function clearUserCart(app: FastifyInstance, cookie: string): Promise<void> {
  const cart = await app.inject({
    method: 'GET',
    url: '/api/v1/cart',
    headers: { ...TENANT_HEADER, cookie },
  });
  if (cart.statusCode !== 200) return;
  const itens = cart.json().data?.itens as Array<{ id: number }> | undefined;
  for (const item of itens ?? []) {
    await app.inject({
      method: 'DELETE',
      url: `/api/v1/cart/items/${item.id}`,
      headers: { ...TENANT_HEADER, cookie },
    });
  }
}

/** Adiciona produto padrão ao carrinho do usuário autenticado. */
export async function seedCartItem(
  app: FastifyInstance,
  cookie: string,
  produtoId = getTestProdutoId(),
  opts: { clearFirst?: boolean } = {},
): Promise<void> {
  if (opts.clearFirst !== false) {
    await clearUserCart(app, cookie);
  }
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/cart/items',
    headers: { ...TENANT_HEADER, cookie, 'content-type': 'application/json' },
    payload: { produto_id: produtoId, quantidade: 1 },
  });
  if (res.statusCode !== 200) {
    throw new Error(`seedCartItem falhou (${res.statusCode}): ${res.body}`);
  }
}

/** Fluxo completo: login comprador → carrinho → checkout método teste. */
export async function seedPedidoViaCheckout(app: FastifyInstance): Promise<{
  pedidoId: number;
  cookie: string;
}> {
  const cookie = await loginUserCookie(app);
  await seedCartItem(app, cookie);

  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/checkout',
    headers: { ...TENANT_HEADER, cookie, 'content-type': 'application/json' },
    payload: {
      ...CHECKOUT_ADDRESS,
      metodo_pagamento: 'teste',
    },
  });

  if (res.statusCode !== 201) {
    throw new Error(`checkout teste falhou (${res.statusCode}): ${res.body}`);
  }

  const pedidoId = res.json().data.pedido_id as number;
  return { pedidoId, cookie };
}
