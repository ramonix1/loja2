import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { loginAdminCookie, loginUserCookie, TENANT_HEADER } from '../helpers/session.js';

describe('GET /api/v1/admin/pedidos', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('como admin: 200 paginado (meta.total + data[])', async () => {
    const cookie = await loginAdminCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/pedidos?page=1&perPage=10',
      headers: { ...TENANT_HEADER, cookie },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta.page).toBe(1);
    expect(body.meta.perPage).toBe(10);
    expect(typeof body.meta.total).toBe('number');
  });

  it('sem autenticação: 401 UNAUTHORIZED', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/pedidos',
      headers: { ...TENANT_HEADER },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('UNAUTHORIZED');
  });

  it('como usuário comum: 403 FORBIDDEN', async () => {
    const cookie = await loginUserCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/pedidos',
      headers: { ...TENANT_HEADER, cookie },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('FORBIDDEN');
  });
});
