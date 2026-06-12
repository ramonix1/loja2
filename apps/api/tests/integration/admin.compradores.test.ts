import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { TEST_USER_EMAIL } from '../helpers/seed.js';
import { loginAdminCookie, loginUserCookie, TENANT_HEADER } from '../helpers/session.js';

describe('GET /api/v1/admin/compradores', () => {
  let app: FastifyInstance;
  let adminCookie: string;

  beforeAll(async () => {
    app = await buildTestApp();
    adminCookie = await loginAdminCookie(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET lista como admin: 200 com totais', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/compradores',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta.totais).toMatchObject({
      total_compradores: expect.any(Number),
      ativos: expect.any(Number),
      novos_mes: expect.any(Number),
    });
    expect(body.data.some((c: { email: string }) => c.email === TEST_USER_EMAIL)).toBe(true);
  });

  it('GET lista com busca: filtra por e-mail', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/compradores?busca=${encodeURIComponent(TEST_USER_EMAIL)}`,
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data.every((c: { email: string }) => c.email.includes('comprador'))).toBe(true);
  });

  it('GET detalhe do comprador de teste: 200', async () => {
    const listRes = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/compradores?busca=${encodeURIComponent(TEST_USER_EMAIL)}`,
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    const comprador = listRes.json().data[0] as { id: number };

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/compradores/${comprador.id}`,
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json().data;
    expect(body.comprador.email).toBe(TEST_USER_EMAIL);
    expect(Array.isArray(body.pedidos)).toBe(true);
    expect(body.resumo).toMatchObject({ total_pedidos: expect.any(Number) });
  });

  it('GET detalhe inexistente: 404', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/compradores/999999',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe('NOT_FOUND');
  });

  it('sem autenticação: 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/compradores',
      headers: { ...TENANT_HEADER },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('UNAUTHORIZED');
  });

  it('como usuário comum: 403', async () => {
    const cookie = await loginUserCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/compradores',
      headers: { ...TENANT_HEADER, cookie },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('FORBIDDEN');
  });
});
