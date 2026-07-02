import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { extractSessionCookie } from '../helpers/session.js';
import { masterPool } from '../../src/lib/master-db.js';
import { merchantDbName } from '../../src/lib/merchant-provision.js';
import {
  TEST_MERCHANT_OWNER_EMAIL,
  TEST_MERCHANT_OWNER_SENHA,
  TEST_MERCHANT_STORE_SLUG,
} from '../helpers/seed.js';

/**
 * MA6 — signup self-service do modelo merchant account
 * (`POST /api/v1/public/merchant-signup`). Não substitui `/public/signup`
 * (modelo tenant legado, testado em `public.signup.test.ts`) — ver assunções
 * em docs/specs/merchant-account-STATUS.md.
 */
const MERCHANT_SLUG = 'ma6-signup-merchant';
const MERCHANT_SLUG_2 = 'ma6-signup-merchant-2';
const STORE_SLUG = 'ma6-signup-loja';
const STORE_SLUG_2 = 'ma6-signup-loja-2';
const OWNER_EMAIL = 'owner@ma6-signup.test.local';
const OWNER_EMAIL_2 = 'owner2@ma6-signup.test.local';
const MERCHANT_SLUG_SESSION = 'ma6-signup-session';
const STORE_SLUG_SESSION = 'ma6-signup-session-loja';
const OWNER_EMAIL_SESSION = 'session-owner@ma6-signup.test.local';

async function dropMerchant(slug: string): Promise<void> {
  await masterPool.query('DELETE FROM merchants WHERE slug = $1', [slug]);
  await masterPool.query(`DROP DATABASE IF EXISTS "${merchantDbName(slug)}" WITH (FORCE)`);
}

async function cleanup(): Promise<void> {
  await dropMerchant(MERCHANT_SLUG);
  await dropMerchant(MERCHANT_SLUG_2);
  await dropMerchant(MERCHANT_SLUG_SESSION);
}

function signupPayload(over: Record<string, unknown> = {}) {
  return {
    planSlug: 'starter',
    merchant: { slug: MERCHANT_SLUG, name: 'Conta Signup MA6' },
    store: { slug: STORE_SLUG, name: 'Loja Signup MA6' },
    owner: { name: 'Dono MA6', email: OWNER_EMAIL, senha: 'senha-forte-123' },
    ...over,
  };
}

describe('Signup self-service merchant account — POST /api/v1/public/merchant-signup', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await cleanup();
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
    await cleanup();
  });

  it('GET check-slug: merchant/loja reservados, ocupados e disponíveis', async () => {
    const reservedStore = await app.inject({
      method: 'GET',
      url: '/api/v1/public/merchant-signup/check-slug?slug=admin',
    });
    expect(reservedStore.json().data.available).toBe(false);
    expect(reservedStore.json().data.reason).toBe('RESERVED');

    const takenStore = await app.inject({
      method: 'GET',
      url: `/api/v1/public/merchant-signup/check-slug?slug=${TEST_MERCHANT_STORE_SLUG}`,
    });
    expect(takenStore.json().data.available).toBe(false);
    expect(takenStore.json().data.reason).toBe('TAKEN');

    const freeStore = await app.inject({
      method: 'GET',
      url: `/api/v1/public/merchant-signup/check-slug?slug=${STORE_SLUG}`,
    });
    expect(freeStore.json().data.available).toBe(true);

    const freeMerchant = await app.inject({
      method: 'GET',
      url: `/api/v1/public/merchant-signup/check-slug?type=merchant&slug=${MERCHANT_SLUG}`,
    });
    expect(freeMerchant.json().data.available).toBe(true);
  });

  it('check-slug sem slug → 400', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/public/merchant-signup/check-slug' });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('VALIDATION_ERROR');
  });

  it('Enterprise não auto-provisiona → 422 ENTERPRISE_CONTACT', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/merchant-signup',
      payload: signupPayload({ planSlug: 'enterprise' }),
    });
    expect(res.statusCode).toBe(422);
    expect(res.json().code).toBe('ENTERPRISE_CONTACT');
  });

  it('slug de loja reservado → 409 STORE_SLUG_RESERVED', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/merchant-signup',
      payload: signupPayload({ store: { slug: 'admin', name: 'Reservada' } }),
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe('STORE_SLUG_RESERVED');
  });

  it('slug de loja já usado globalmente → 409 STORE_SLUG_EXISTS', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/merchant-signup',
      payload: signupPayload({ store: { slug: TEST_MERCHANT_STORE_SLUG, name: 'Duplicada' } }),
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe('STORE_SLUG_EXISTS');
  });

  it('happy path: cria merchant (max_stores=1) + owner + loja #1', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/merchant-signup',
      payload: signupPayload(),
    });
    expect(res.statusCode).toBe(201);
    const data = res.json().data;
    expect(data.merchantSlug).toBe(MERCHANT_SLUG);
    expect(data.storeSlug).toBe(STORE_SLUG);
    expect(data.ownerEmail).toBe(OWNER_EMAIL);
    expect(data.storefrontUrl).toContain(`/store/${STORE_SLUG}`);
    expect(data.adminUrl).toContain('/admin/dashboard');
    expect(data.trialEndsAt).toBeDefined();

    const merchantRow = await masterPool.query<{ id: number; max_stores: number }>(
      'SELECT id, max_stores FROM merchants WHERE slug = $1',
      [MERCHANT_SLUG],
    );
    expect(merchantRow.rows).toHaveLength(1);
    expect(merchantRow.rows[0]!.max_stores).toBe(1);

    const billing = await masterPool.query<{ status: string; trial_ends_at: Date | null }>(
      'SELECT status, trial_ends_at FROM merchant_billing WHERE merchant_id = $1',
      [merchantRow.rows[0]!.id],
    );
    expect(billing.rows).toHaveLength(1);
    expect(billing.rows[0]!.status).toBe('trialing');
    expect(billing.rows[0]!.trial_ends_at).not.toBeNull();

    const memberRow = await masterPool.query<{ role: string }>(
      'SELECT role FROM merchant_members WHERE merchant_id = $1 AND email = $2',
      [merchantRow.rows[0]!.id, OWNER_EMAIL],
    );
    expect(memberRow.rows[0]!.role).toBe('owner');

    const storeRow = await masterPool.query('SELECT id FROM stores WHERE slug = $1', [STORE_SLUG]);
    expect(storeRow.rows).toHaveLength(1);
  });

  it('signup autentica o owner e substitui sessão anterior', async () => {
    const oldLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_MERCHANT_OWNER_EMAIL, senha: TEST_MERCHANT_OWNER_SENHA },
    });
    expect(oldLogin.statusCode).toBe(200);
    const oldCookie = extractSessionCookie(oldLogin);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/merchant-signup',
      headers: { cookie: oldCookie },
      payload: signupPayload({
        merchant: { slug: MERCHANT_SLUG_SESSION, name: 'Conta Session MA6' },
        store: { slug: STORE_SLUG_SESSION, name: 'Loja Session MA6' },
        owner: { name: 'Dono Session', email: OWNER_EMAIL_SESSION, senha: 'senha-forte-123' },
      }),
    });
    expect(res.statusCode).toBe(201);
    const newCookie = extractSessionCookie(res);

    const me = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { cookie: newCookie },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().data.usuario.email).toBe(OWNER_EMAIL_SESSION);
    expect(me.json().data.merchant.slug).toBe(MERCHANT_SLUG_SESSION);
    expect(me.json().data.store.slug).toBe(STORE_SLUG_SESSION);
  });

  it('login com o owner recém-criado retorna step ready (conta merchant O(1))', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: OWNER_EMAIL, senha: 'senha-forte-123' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.step).toBe('ready');
    expect(res.json().data.merchant.slug).toBe(MERCHANT_SLUG);
    expect(res.json().data.store.slug).toBe(STORE_SLUG);
  });

  it('slug de merchant duplicado → 409 MERCHANT_SLUG_EXISTS', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/merchant-signup',
      payload: signupPayload({
        store: { slug: STORE_SLUG_2, name: 'Outra loja' },
        owner: { name: 'Outro', email: OWNER_EMAIL_2, senha: 'senha-forte-123' },
      }),
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe('MERCHANT_SLUG_EXISTS');
  });

  it('plano professional cria merchant com max_stores=3', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/merchant-signup',
      payload: signupPayload({
        planSlug: 'professional',
        merchant: { slug: MERCHANT_SLUG_2, name: 'Conta Pro MA6' },
        store: { slug: STORE_SLUG_2, name: 'Loja Pro MA6' },
        owner: { name: 'Dono Pro', email: OWNER_EMAIL_2, senha: 'senha-forte-123' },
      }),
    });
    expect(res.statusCode).toBe(201);

    const merchantRow = await masterPool.query<{ max_stores: number }>(
      'SELECT max_stores FROM merchants WHERE slug = $1',
      [MERCHANT_SLUG_2],
    );
    expect(merchantRow.rows[0]!.max_stores).toBe(3);
  });
});
