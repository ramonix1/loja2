import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { TEST_ADMIN_EMAIL } from '../helpers/seed.js';
import { loginAdminCookie, loginUserCookie, TENANT_HEADER } from '../helpers/session.js';

describe('Admin permissoes', () => {
  let app: FastifyInstance;
  let adminCookie: string;

  beforeAll(async () => {
    app = await buildTestApp();
    adminCookie = await loginAdminCookie(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/admin/permissoes: 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/permissoes',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.some((a: { email: string }) => a.email === TEST_ADMIN_EMAIL)).toBe(true);
  });

  it('POST criar admin: 201', async () => {
    const email = `admin-test-${Date.now()}@loja.com`;
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/permissoes',
      headers: { ...TENANT_HEADER, cookie: adminCookie, 'content-type': 'application/json' },
      payload: {
        nome: 'Admin Teste',
        email,
        senha: 'senha1234',
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.email).toBe(email);
  });

  it('POST email duplicado: 409', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/permissoes',
      headers: { ...TENANT_HEADER, cookie: adminCookie, 'content-type': 'application/json' },
      payload: {
        nome: 'Duplicado',
        email: TEST_ADMIN_EMAIL,
        senha: 'senha1234',
      },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe('EMAIL_EXISTS');
  });

  it('POST senha curta: 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/permissoes',
      headers: { ...TENANT_HEADER, cookie: adminCookie, 'content-type': 'application/json' },
      payload: {
        nome: 'Curta',
        email: 'curta@loja.com',
        senha: '123',
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('VALIDATION_ERROR');
  });

  it('PATCH toggle outro admin: 200', async () => {
    const email = `toggle-${Date.now()}@loja.com`;
    const create = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/permissoes',
      headers: { ...TENANT_HEADER, cookie: adminCookie, 'content-type': 'application/json' },
      payload: { nome: 'Toggle Test', email, senha: 'senha1234' },
    });
    const id = create.json().data.id as number;

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/admin/permissoes/${id}/toggle`,
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);

    await app.inject({
      method: 'DELETE',
      url: `/api/v1/admin/permissoes/${id}`,
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
  });

  it('PATCH toggle própria conta: 403', async () => {
    const me = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    const id = me.json().data.usuario.id as number;

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/admin/permissoes/${id}/toggle`,
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('CANNOT_MODIFY_SELF');
  });

  it('GET sem sessão: 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/permissoes',
      headers: TENANT_HEADER,
    });
    expect(res.statusCode).toBe(401);
  });

  it('GET como comprador: 403', async () => {
    const cookie = await loginUserCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/permissoes',
      headers: { ...TENANT_HEADER, cookie },
    });
    expect(res.statusCode).toBe(403);
  });
});
