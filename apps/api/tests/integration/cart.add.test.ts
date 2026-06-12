import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { loginUserCookie, TENANT_HEADER } from '../helpers/session.js';
import { getTestProdutoId } from '../helpers/fixture-ids.js';

describe('Cart add', () => {
  let app: FastifyInstance;
  let userCookie: string;

  beforeAll(async () => {
    app = await buildTestApp();
    userCookie = await loginUserCookie(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST add item autenticado: 200, item no cart', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/cart/items',
      headers: { ...TENANT_HEADER, cookie: userCookie, 'content-type': 'application/json' },
      payload: { produto_id: getTestProdutoId(), quantidade: 1 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.contagem).toBeGreaterThan(0);

    const cart = await app.inject({
      method: 'GET',
      url: '/api/v1/cart',
      headers: { ...TENANT_HEADER, cookie: userCookie },
    });
    expect(cart.statusCode).toBe(200);
    expect(cart.json().data.itens.length).toBeGreaterThan(0);
  });

  it('POST add sem auth: 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/cart/items',
      headers: { ...TENANT_HEADER, 'content-type': 'application/json' },
      payload: { produto_id: getTestProdutoId(), quantidade: 1 },
    });
    expect(res.statusCode).toBe(401);
  });
});
