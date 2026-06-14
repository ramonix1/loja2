import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { loginAdminCookie, loginUserCookie, TENANT_HEADER } from '../helpers/session.js';

describe('GET /api/v1/admin/relatorios', () => {
  let app: FastifyInstance;
  let adminCookie: string;

  beforeAll(async () => {
    app = await buildTestApp();
    adminCookie = await loginAdminCookie(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET aba vendas como admin: 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/relatorios?aba=vendas',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.meta.aba).toBe('vendas');
    expect(body.data).toHaveProperty('resumo');
    expect(body.data).toHaveProperty('pedidos');
  });

  it('GET aba estoque: 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/relatorios?aba=estoque&filtro_estoque=todos',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveProperty('produtos');
  });

  it('GET aba inválida: 400', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/relatorios?aba=invalida',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('VALIDATION_ERROR');
  });

  it('GET CSV vendas: 200 text/csv', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/relatorios/csv/vendas',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.body).toContain('ID');
  });

  it('GET sem sessão: 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/relatorios?aba=vendas',
      headers: TENANT_HEADER,
    });
    expect(res.statusCode).toBe(401);
  });

  it('GET como comprador: 403', async () => {
    const cookie = await loginUserCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/relatorios?aba=vendas',
      headers: { ...TENANT_HEADER, cookie },
    });
    expect(res.statusCode).toBe(403);
  });
});
