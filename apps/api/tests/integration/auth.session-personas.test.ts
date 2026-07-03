import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { extractSessionCookie, STORE_HEADER } from '../helpers/session.js';
import {
  TEST_ADMIN_EMAIL,
  TEST_ADMIN_SENHA,
  TEST_STORE_SLUG,
  TEST_USER_EMAIL,
  TEST_USER_SENHA,
} from '../helpers/seed.js';

const MERCHANT_HEADER = { 'x-auth-context': 'merchant' };
const BUYER_HEADER = { 'x-auth-context': 'buyer' };

describe('Personas de sessão — comprador vs lojista', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('login comprador preserva lojista em stash e /auth/me merchant retorna lojista', async () => {
    const merchantLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_ADMIN_EMAIL, senha: TEST_ADMIN_SENHA },
    });
    expect(merchantLogin.statusCode).toBe(200);
    let cookie = extractSessionCookie(merchantLogin);

    const buyerLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { ...STORE_HEADER, ...BUYER_HEADER, cookie },
      payload: {
        email: TEST_USER_EMAIL,
        senha: TEST_USER_SENHA,
        storeSlug: TEST_STORE_SLUG,
      },
    });
    expect(buyerLogin.statusCode).toBe(200);
    cookie = extractSessionCookie(buyerLogin);

    const buyerMe = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { ...BUYER_HEADER, cookie },
    });
    expect(buyerMe.statusCode).toBe(200);
    expect(buyerMe.json().data.usuario.role).toBe('usuario');

    const merchantMe = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { ...MERCHANT_HEADER, cookie },
    });
    expect(merchantMe.statusCode).toBe(200);
    expect(merchantMe.json().data.usuario.email).toBe(TEST_ADMIN_EMAIL);
    expect(merchantMe.json().data.usuario.role).toBe('owner');
  });

  it('login lojista na vitrine (fallback) retorna redirectToAdmin', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { ...STORE_HEADER },
      payload: {
        email: TEST_ADMIN_EMAIL,
        senha: TEST_ADMIN_SENHA,
        storeSlug: TEST_STORE_SLUG,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json().data;
    expect(body.redirectToAdmin).toBe(true);
    expect(body.user.role).toBe('owner');
  });

  it('logout buyer restaura lojista stashed', async () => {
    const merchantLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_ADMIN_EMAIL, senha: TEST_ADMIN_SENHA },
    });
    let cookie = extractSessionCookie(merchantLogin);

    const buyerLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { ...STORE_HEADER, cookie },
      payload: {
        email: TEST_USER_EMAIL,
        senha: TEST_USER_SENHA,
        storeSlug: TEST_STORE_SLUG,
      },
    });
    cookie = extractSessionCookie(buyerLogin);

    const logout = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      headers: { ...BUYER_HEADER, cookie },
    });
    expect(logout.statusCode).toBe(200);
    const logoutCookie = logout.headers['set-cookie'];
    if (logoutCookie) {
      cookie = extractSessionCookie(logout);
    }

    const merchantMe = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { ...MERCHANT_HEADER, cookie },
    });
    expect(merchantMe.statusCode).toBe(200);
    expect(merchantMe.json().data.usuario.role).toBe('owner');
  });
});
