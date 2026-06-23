import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { TENANT_HEADER } from '../helpers/session.js';
import { TEST_ADMIN_EMAIL, TEST_ADMIN_SENHA } from '../helpers/seed.js';

describe('POST /api/v1/auth/login', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('autentica com tenantSlug no body sem header (200 + Set-Cookie)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: TEST_ADMIN_EMAIL,
        senha: TEST_ADMIN_SENHA,
        tenantSlug: 'loja',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.step).toBe('ready');
    expect(body.data.tenant.slug).toBe('loja');

    const setCookie = res.headers['set-cookie'];
    const cookieStr = Array.isArray(setCookie) ? setCookie.join(';') : setCookie;
    expect(cookieStr).toContain('lojao.sid=');
  });

  it('autentica admin com credenciais válidas (200 + Set-Cookie)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { ...TENANT_HEADER },
      payload: { email: TEST_ADMIN_EMAIL, senha: TEST_ADMIN_SENHA, tenantSlug: 'loja' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.step).toBe('ready');
    expect(body.data.user.email).toBe(TEST_ADMIN_EMAIL);
    expect(body.data.user.role).toBe('admin');

    const setCookie = res.headers['set-cookie'];
    const cookieStr = Array.isArray(setCookie) ? setCookie.join(';') : setCookie;
    expect(cookieStr).toContain('lojao.sid=');
  });

  it('rejeita tenantSlug inexistente (404 TENANT_NOT_FOUND)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: TEST_ADMIN_EMAIL,
        senha: TEST_ADMIN_SENHA,
        tenantSlug: 'loja-inexistente',
      },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe('TENANT_NOT_FOUND');
  });

  it('rejeita senha inválida no tenant correto (401 UNAUTHORIZED)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { ...TENANT_HEADER },
      payload: { email: TEST_ADMIN_EMAIL, senha: 'senha-errada', tenantSlug: 'loja' },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('UNAUTHORIZED');
  });
});
