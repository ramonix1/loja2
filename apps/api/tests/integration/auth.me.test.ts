import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { TENANT_HEADER, loginAdminCookie } from '../helpers/session.js';

describe('GET /api/v1/auth/me', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('retorna 401 sem cookie de sessão', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { ...TENANT_HEADER },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('UNAUTHORIZED');
  });

  it('retorna usuário e tenant após login', async () => {
    const cookie = await loginAdminCookie(app);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { ...TENANT_HEADER, cookie },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.usuario.role).toBe('admin');
    expect(body.data.tenant.slug).toBe('loja');
    expect(body.data.tenant.lojaNome).toEqual(expect.any(String));
    expect(body.data.tenant.lojaNome.length).toBeGreaterThan(0);
  });
});
