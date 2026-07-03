import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { extractSessionCookie } from '../helpers/session.js';
import {
  TEST_MERCHANT_MULTI_OWNER_EMAIL,
  TEST_MERCHANT_MULTI_OWNER_SENHA,
  TEST_MERCHANT_MULTI_SLUG,
  TEST_MERCHANT_MULTI_STORE_A_SLUG,
  TEST_MERCHANT_MULTI_STORE_B_SLUG,
  TEST_MERCHANT_OWNER_EMAIL,
  TEST_MERCHANT_OWNER_SENHA,
  TEST_MERCHANT_SLUG,
  TEST_MERCHANT_STORE_SLUG,
} from '../helpers/seed.js';

/**
 * MA5 — login O(1) da conta merchant (`merchant_members`), sem scan cross-DB.
 * Ver docs/specs/merchant-account-architecture-spec.md §5 e
 * docs/specs/merchant-account-STATUS.md (assunções MA5).
 */
describe('Conta merchant (MA5) — POST /api/v1/auth/login', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('merchant com 1 loja: login retorna step ready com storeId auto-selecionado', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_MERCHANT_OWNER_EMAIL, senha: TEST_MERCHANT_OWNER_SENHA },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.step).toBe('ready');
    expect(body.data.merchant.slug).toBe(TEST_MERCHANT_SLUG);
    expect(body.data.store.slug).toBe(TEST_MERCHANT_STORE_SLUG);
    expect(body.data.user.email).toBe(TEST_MERCHANT_OWNER_EMAIL);
    expect(body.data.user.role).toBe('owner');

    const cookie = extractSessionCookie(res);
    const me = await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { cookie } });
    expect(me.statusCode).toBe(200);
    expect(me.json().data.merchant.slug).toBe(TEST_MERCHANT_SLUG);
    expect(me.json().data.store.slug).toBe(TEST_MERCHANT_STORE_SLUG);
  });

  it('merchant com 2 lojas: login retorna step select_store sem storeId na sessão', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_MERCHANT_MULTI_OWNER_EMAIL, senha: TEST_MERCHANT_MULTI_OWNER_SENHA },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.step).toBe('select_store');
    expect(body.data.merchant.slug).toBe(TEST_MERCHANT_MULTI_SLUG);
    expect(body.data.stores.map((s: { slug: string }) => s.slug).sort()).toEqual(
      [TEST_MERCHANT_MULTI_STORE_A_SLUG, TEST_MERCHANT_MULTI_STORE_B_SLUG].sort(),
    );

    const cookie = extractSessionCookie(res);
    const me = await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { cookie } });
    expect(me.json().data.merchant.slug).toBe(TEST_MERCHANT_MULTI_SLUG);
    expect(me.json().data.store).toBeNull();
  });

  it('rejeita senha inválida da conta merchant (401 UNAUTHORIZED, sem cair no scan legado)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_MERCHANT_OWNER_EMAIL, senha: 'senha-errada' },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('UNAUTHORIZED');
  });
});

describe('Conta merchant (MA5) — GET /auth/my-stores e POST /auth/select-store', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /auth/my-stores lista as lojas do merchant (O(1), sem scan)', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_MERCHANT_MULTI_OWNER_EMAIL, senha: TEST_MERCHANT_MULTI_OWNER_SENHA },
    });
    const cookie = extractSessionCookie(loginRes);

    const res = await app.inject({ method: 'GET', url: '/api/v1/auth/my-stores', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.stores.map((s: { slug: string }) => s.slug).sort()).toEqual(
      [TEST_MERCHANT_MULTI_STORE_A_SLUG, TEST_MERCHANT_MULTI_STORE_B_SLUG].sort(),
    );
  });

  it('POST /auth/select-store seta storeId na sessão', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_MERCHANT_MULTI_OWNER_EMAIL, senha: TEST_MERCHANT_MULTI_OWNER_SENHA },
    });
    let cookie = extractSessionCookie(loginRes);

    const selectRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/select-store',
      headers: { cookie },
      payload: { storeSlug: TEST_MERCHANT_MULTI_STORE_B_SLUG },
    });
    expect(selectRes.statusCode).toBe(200);
    expect(selectRes.json().data.store.slug).toBe(TEST_MERCHANT_MULTI_STORE_B_SLUG);
    cookie = extractSessionCookie(selectRes);

    const me = await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { cookie } });
    expect(me.json().data.store.slug).toBe(TEST_MERCHANT_MULTI_STORE_B_SLUG);
  });

  it('POST /auth/select-store com loja de outro merchant retorna 403 FORBIDDEN', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_MERCHANT_MULTI_OWNER_EMAIL, senha: TEST_MERCHANT_MULTI_OWNER_SENHA },
    });
    const cookie = extractSessionCookie(loginRes);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/select-store',
      headers: { cookie },
      payload: { storeSlug: TEST_MERCHANT_STORE_SLUG },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('FORBIDDEN');
  });

  it('POST /auth/select-store sem sessão de conta merchant retorna 401 UNAUTHORIZED', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/select-store',
      payload: { storeSlug: TEST_MERCHANT_MULTI_STORE_A_SLUG },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('UNAUTHORIZED');
  });

  it('POST /auth/clear-store limpa a loja selecionada mantendo a conta', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_MERCHANT_OWNER_EMAIL, senha: TEST_MERCHANT_OWNER_SENHA },
    });
    let cookie = extractSessionCookie(loginRes);
    expect(loginRes.json().data.step).toBe('ready');

    const clearRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/clear-store',
      headers: { cookie },
    });
    expect(clearRes.statusCode).toBe(200);
    cookie = extractSessionCookie(clearRes);

    const me = await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { cookie } });
    expect(me.statusCode).toBe(200);
    expect(me.json().data.store).toBeNull();
    expect(me.json().data.merchant.slug).toBe(TEST_MERCHANT_SLUG);
  });
});
