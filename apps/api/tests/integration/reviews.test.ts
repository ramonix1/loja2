import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { getTestProdutoEstoqueId, getTestProdutoId } from '../helpers/fixture-ids.js';
import { ensureReviewTestFixtures } from '../helpers/review-fixtures.js';
import { loginAdminCookie, loginUserCookie, TENANT_HEADER } from '../helpers/session.js';

describe('Product reviews API', () => {
  let app: FastifyInstance;
  let userCookie: string;
  let adminCookie: string;
  const productId = () => getTestProdutoId();

  beforeAll(async () => {
    app = await buildTestApp();
    await ensureReviewTestFixtures();
    userCookie = await loginUserCookie(app);
    adminCookie = await loginAdminCookie(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /products/:id/reviews sem auth: 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/products/${productId()}/reviews`,
      headers: { ...TENANT_HEADER, 'content-type': 'application/json' },
      payload: { rating: 5, comment: 'Ótimo produto' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST review sem pedido entregue: 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/products/${getTestProdutoEstoqueId()}/reviews`,
      headers: { ...TENANT_HEADER, cookie: userCookie, 'content-type': 'application/json' },
      payload: { rating: 4 },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('FORBIDDEN');
  });

  it('POST review com pedido entregue: 200', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/products/${productId()}/reviews`,
      headers: { ...TENANT_HEADER, cookie: userCookie, 'content-type': 'application/json' },
      payload: { rating: 5, comment: 'Excelente compra' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.id).toBeGreaterThan(0);
  });

  it('POST review duplicada: 409', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/products/${productId()}/reviews`,
      headers: { ...TENANT_HEADER, cookie: userCookie, 'content-type': 'application/json' },
      payload: { rating: 4 },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe('REVIEW_ALREADY_EXISTS');
  });

  it('GET /public/products/:id/reviews: 200 com meta', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/public/products/${productId()}/reviews?page=1&limit=10`,
      headers: TENANT_HEADER,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.meta.total).toBeGreaterThan(0);
    expect(typeof body.data[0].author_name).toBe('string');
  });

  it('GET /admin/reviews como admin: 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/reviews?page=1&limit=10',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

  it('PATCH /admin/reviews/:id rejeitar: 200', async () => {
    const list = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/reviews?page=1&limit=1',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    const reviewId = list.json().data[0]?.id as number;
    expect(reviewId).toBeGreaterThan(0);

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/admin/reviews/${reviewId}`,
      headers: { ...TENANT_HEADER, cookie: adminCookie, 'content-type': 'application/json' },
      payload: { status: 'rejected' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.status).toBe('rejected');
  });
});
