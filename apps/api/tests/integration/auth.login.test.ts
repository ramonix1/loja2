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

  it('autentica admin com credenciais válidas (200 + Set-Cookie)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { ...TENANT_HEADER },
      payload: { email: TEST_ADMIN_EMAIL, senha: TEST_ADMIN_SENHA },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.email).toBe(TEST_ADMIN_EMAIL);
    expect(body.data.role).toBe('admin');

    const setCookie = res.headers['set-cookie'];
    const cookieStr = Array.isArray(setCookie) ? setCookie.join(';') : setCookie;
    expect(cookieStr).toContain('lojao.sid=');
  });

  it('rejeita senha inválida (401 UNAUTHORIZED)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { ...TENANT_HEADER },
      payload: { email: TEST_ADMIN_EMAIL, senha: 'senha-errada' },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('UNAUTHORIZED');
  });
});
