import type { FastifyInstance } from 'fastify';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { CHECKOUT_ADDRESS, clearUserCart, seedCartItem, seedPedidoViaCheckout } from '../helpers/seed-order.js';
import { loginUserCookie, TENANT_HEADER } from '../helpers/session.js';
import { getTestProdutoEstoqueId, getTestProdutoId } from '../helpers/fixture-ids.js';

describe('Checkout método teste', () => {
  let app: FastifyInstance;
  let userCookie: string;

  beforeAll(async () => {
    app = await buildTestApp();
    userCookie = await loginUserCookie(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST método teste: pedido pago, id retornado', async () => {
    await seedCartItem(app, userCookie, getTestProdutoId());
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/checkout',
      headers: { ...TENANT_HEADER, cookie: userCookie, 'content-type': 'application/json' },
      payload: { ...CHECKOUT_ADDRESS, metodo_pagamento: 'teste' },
    });
    expect(res.statusCode).toBe(201);
    const { pedido_id, status } = res.json().data;
    expect(status).toBe('pago');
    expect(pedido_id).toBeGreaterThan(0);
  });

  it('POST estoque insuficiente: 409', async () => {
    const cookie = await loginUserCookie(app);
    await clearUserCart(app, cookie);
    await seedCartItem(app, cookie, getTestProdutoEstoqueId(), { clearFirst: false });

    const cart = await app.inject({
      method: 'GET',
      url: '/api/v1/cart',
      headers: { ...TENANT_HEADER, cookie },
    });
    const itemId = cart.json().data.itens[0].id as number;

    await app.inject({
      method: 'PATCH',
      url: `/api/v1/cart/items/${itemId}`,
      headers: { ...TENANT_HEADER, cookie, 'content-type': 'application/json' },
      payload: { quantidade: 2 },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/checkout',
      headers: { ...TENANT_HEADER, cookie, 'content-type': 'application/json' },
      payload: { ...CHECKOUT_ADDRESS, metodo_pagamento: 'teste' },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe('INSUFFICIENT_STOCK');
  });

  it('fluxo login → cart → checkout teste → pedido pago', async () => {
    const { pedidoId } = await seedPedidoViaCheckout(app);
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false,
    });
    try {
      const r = await pool.query('SELECT status FROM pedidos WHERE id = $1', [pedidoId]);
      expect(r.rows[0]?.status).toBe('pago');
    } finally {
      await pool.end();
    }
  });
});
