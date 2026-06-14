import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { TEST_PRODUTO_ID, TEST_TENANT_SLUG } from '../helpers/seed.js';
import { TENANT_HEADER } from '../helpers/session.js';

describe('GET /api/v1/public/store', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('retorna loja + categorias + produtos sem auth', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/public/store',
      headers: { ...TENANT_HEADER },
    });

    expect(res.statusCode).toBe(200);
    const { data } = res.json();
    expect(data.loja.nome).toBeTruthy();
    expect(data.loja.cor_primaria).toBeTruthy();
    expect(Array.isArray(data.categorias)).toBe(true);
    expect(Array.isArray(data.produtos_sem_categoria)).toBe(true);
    expect(typeof data.controla_estoque).toBe('boolean');
  });

  it('404 tenant inexistente', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/public/store',
      headers: { 'x-tenant-slug': 'nao-existe-' + TEST_TENANT_SLUG },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe('TENANT_NOT_FOUND');
  });
});

describe('GET /api/v1/public/products', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lista produtos públicos', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/public/products',
      headers: { ...TENANT_HEADER },
    });

    expect(res.statusCode).toBe(200);
    const { data } = res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toMatchObject({
      id: expect.any(Number),
      nome: expect.any(String),
      valor: expect.any(Number),
    });
  });
});

describe('GET /api/v1/public/products/:id', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('detalhe produto seed', async () => {
    const productId = TEST_PRODUTO_ID || 1;
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/public/products/${productId}`,
      headers: { ...TENANT_HEADER },
    });

    expect(res.statusCode).toBe(200);
    const { data } = res.json();
    expect(data.id).toBe(productId);
    expect(data.nome).toBeTruthy();
    expect(Array.isArray(data.imagens)).toBe(true);
  });

  it('404 produto inexistente', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/public/products/999999',
      headers: { ...TENANT_HEADER },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe('NOT_FOUND');
  });
});
