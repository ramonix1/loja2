import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { loginAdminCookie, loginUserCookie, TENANT_HEADER } from '../helpers/session.js';

describe('GET /api/v1/admin/dashboard/charts', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET charts 30d como admin: 200 com shape esperado', async () => {
    const cookie = await loginAdminCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/dashboard/charts?periodo=30d',
      headers: { ...TENANT_HEADER, cookie },
    });

    expect(res.statusCode).toBe(200);
    const { data } = res.json();
    expect(data.periodo).toBe('30d');
    expect(Array.isArray(data.receita_por_dia)).toBe(true);
    expect(Array.isArray(data.pedidos_por_status)).toBe(true);
    expect(Array.isArray(data.receita_por_metodo)).toBe(true);
    expect(Array.isArray(data.top_produtos)).toBe(true);

    if (data.pedidos_por_status.length > 0) {
      expect(data.pedidos_por_status[0]).toMatchObject({
        status: expect.any(String),
        total: expect.any(Number),
      });
    }
  });

  it('GET charts periodo invalido: 400 VALIDATION_ERROR', async () => {
    const cookie = await loginAdminCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/dashboard/charts?periodo=365d',
      headers: { ...TENANT_HEADER, cookie },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('VALIDATION_ERROR');
  });

  it('GET charts sem auth: 401 UNAUTHORIZED', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/dashboard/charts',
      headers: { ...TENANT_HEADER },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('UNAUTHORIZED');
  });

  it('GET charts como usuário comum: 403 FORBIDDEN', async () => {
    const cookie = await loginUserCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/dashboard/charts',
      headers: { ...TENANT_HEADER, cookie },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('FORBIDDEN');
  });
});
