import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { getTestProdutoId } from '../helpers/fixture-ids.js';
import { loginUserCookie, TENANT_HEADER } from '../helpers/session.js';

describe('Wishlist API', () => {
  let app: FastifyInstance;
  let userCookie: string;
  const productId = () => getTestProdutoId();

  beforeAll(async () => {
    app = await buildTestApp();
    userCookie = await loginUserCookie(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /wishlist sem auth: 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/wishlist',
      headers: TENANT_HEADER,
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /wishlist/:productId: 200', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/wishlist/${productId()}`,
      headers: { ...TENANT_HEADER, cookie: userCookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.added).toBe(true);
  });

  it('POST duplicado é idempotente: 200', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/wishlist/${productId()}`,
      headers: { ...TENANT_HEADER, cookie: userCookie },
    });
    expect(res.statusCode).toBe(200);
  });

  it('GET /wishlist/ids contém produto', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/wishlist/ids',
      headers: { ...TENANT_HEADER, cookie: userCookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.product_ids).toContain(productId());
  });

  it('GET /wishlist/count: 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/wishlist/count',
      headers: { ...TENANT_HEADER, cookie: userCookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.count).toBeGreaterThan(0);
  });

  it('GET /wishlist lista produtos', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/wishlist',
      headers: { ...TENANT_HEADER, cookie: userCookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.products.length).toBeGreaterThan(0);
  });

  it('DELETE /wishlist/:productId: 200', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/wishlist/${productId()}`,
      headers: { ...TENANT_HEADER, cookie: userCookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.removed).toBe(true);
  });

  it('DELETE inexistente: 404', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/wishlist/${productId()}`,
      headers: { ...TENANT_HEADER, cookie: userCookie },
    });
    expect(res.statusCode).toBe(404);
  });
});
