import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { loginUserCookie, TENANT_HEADER } from '../helpers/session.js';

describe('GET /api/v1/orders', () => {
  let app: FastifyInstance;
  let buyerCookie: string;

  beforeAll(async () => {
    app = await buildTestApp();
    buyerCookie = await loginUserCookie(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('lista pedidos do comprador autenticado', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/orders',
      headers: { ...TENANT_HEADER, cookie: buyerCookie },
    });

    expect(res.statusCode).toBe(200);
    const { data } = res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('401 sem sessão', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/orders',
      headers: { ...TENANT_HEADER },
    });

    expect(res.statusCode).toBe(401);
  });
});
