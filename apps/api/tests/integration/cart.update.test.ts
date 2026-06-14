import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { loginUserCookie, TENANT_HEADER } from '../helpers/session.js';
import { clearUserCart } from '../helpers/seed-order.js';
import { getTestProdutoId } from '../helpers/fixture-ids.js';

describe('Cart update', () => {
  let app: FastifyInstance;
  let userCookie: string;
  let itemId: number;

  beforeAll(async () => {
    app = await buildTestApp();
    userCookie = await loginUserCookie(app);
    await clearUserCart(app, userCookie);

    await app.inject({
      method: 'POST',
      url: '/api/v1/cart/items',
      headers: { ...TENANT_HEADER, cookie: userCookie, 'content-type': 'application/json' },
      payload: { produto_id: getTestProdutoId(), quantidade: 1 },
    });

    const cart = await app.inject({
      method: 'GET',
      url: '/api/v1/cart',
      headers: { ...TENANT_HEADER, cookie: userCookie },
    });
    itemId = cart.json().data.itens[0].id as number;
  });

  afterAll(async () => {
    await app.close();
  });

  it('PATCH quantidade: 200', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/cart/items/${itemId}`,
      headers: { ...TENANT_HEADER, cookie: userCookie, 'content-type': 'application/json' },
      payload: { quantidade: 2 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.contagem).toBeGreaterThanOrEqual(2);
  });

  it('PATCH quantidade 0 remove item', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/cart/items/${itemId}`,
      headers: { ...TENANT_HEADER, cookie: userCookie, 'content-type': 'application/json' },
      payload: { quantidade: 0 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.contagem).toBe(0);
  });
});
