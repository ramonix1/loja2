import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { STORE_HEADER } from '../helpers/session.js';
import {
  TEST_ADMIN_EMAIL,
  TEST_ADMIN_SENHA,
  TEST_STORE_SLUG,
  TEST_USER_EMAIL,
  TEST_USER_SENHA,
} from '../helpers/seed.js';

describe('POST /api/v1/auth/login', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('autentica merchant owner sem storeSlug (200 + step ready + Set-Cookie)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: TEST_ADMIN_EMAIL,
        senha: TEST_ADMIN_SENHA,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.step).toBe('ready');
    expect(body.data.store.slug).toBe(TEST_STORE_SLUG);
    expect(body.data.user.email).toBe(TEST_ADMIN_EMAIL);
    expect(body.data.user.role).toBe('owner');

    const setCookie = res.headers['set-cookie'];
    const cookieStr = Array.isArray(setCookie) ? setCookie.join(';') : setCookie;
    expect(cookieStr).toContain('lojao.sid=');
  });

  it('autentica comprador com storeSlug + header (200 + Set-Cookie)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { ...STORE_HEADER },
      payload: {
        email: TEST_USER_EMAIL,
        senha: TEST_USER_SENHA,
        storeSlug: TEST_STORE_SLUG,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.step).toBe('ready');
    expect(body.data.store.slug).toBe(TEST_STORE_SLUG);
    expect(body.data.user.email).toBe(TEST_USER_EMAIL);
    expect(body.data.user.role).toBe('usuario');

    const setCookie = res.headers['set-cookie'];
    const cookieStr = Array.isArray(setCookie) ? setCookie.join(';') : setCookie;
    expect(cookieStr).toContain('lojao.sid=');
  });

  it('rejeita storeSlug inexistente (404 STORE_NOT_FOUND)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { 'x-store-slug': 'loja-inexistente' },
      payload: {
        email: TEST_USER_EMAIL,
        senha: TEST_USER_SENHA,
        storeSlug: 'loja-inexistente',
      },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe('STORE_NOT_FOUND');
  });

  it('rejeita senha inválida da conta merchant (401 UNAUTHORIZED)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_ADMIN_EMAIL, senha: 'senha-errada' },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('UNAUTHORIZED');
  });
});
