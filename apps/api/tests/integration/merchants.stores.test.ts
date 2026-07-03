import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { masterPool } from '../../src/lib/master-db.js';
import { extractSessionCookie } from '../helpers/session.js';
import {
  TEST_MERCHANT_MULTI_OWNER_EMAIL,
  TEST_MERCHANT_MULTI_OWNER_SENHA,
  TEST_MERCHANT_MULTI_SLUG,
  TEST_MERCHANT_OWNER_EMAIL,
  TEST_MERCHANT_OWNER_SENHA,
  TEST_MERCHANT_PLAN_MAX_STORES,
  TEST_MERCHANT_PLAN_OPERATOR_EMAIL,
  TEST_MERCHANT_PLAN_OPERATOR_SENHA,
  TEST_MERCHANT_PLAN_OWNER_EMAIL,
  TEST_MERCHANT_PLAN_OWNER_SENHA,
  TEST_MERCHANT_PLAN_SLUG,
  TEST_MERCHANT_SLUG,
  TEST_MERCHANT_STORE_SLUG,
} from '../helpers/seed.js';

/**
 * MA6 — `POST /api/v1/merchants/:merchantId/stores` (criar loja #2, #3… numa
 * conta já existente, com enforcement de `max_stores` — spec §2.4/§8).
 */
async function merchantIdBySlug(slug: string): Promise<number> {
  const res = await masterPool.query<{ id: number }>('SELECT id FROM merchants WHERE slug = $1', [slug]);
  return res.rows[0]!.id;
}

async function login(
  app: FastifyInstance,
  email: string,
  senha: string,
): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email, senha },
  });
  return extractSessionCookie(res);
}

describe('POST /api/v1/merchants/:merchantId/stores', () => {
  let app: FastifyInstance;
  let planMerchantId: number;
  let singleMerchantId: number;
  let multiMerchantId: number;

  beforeAll(async () => {
    app = await buildTestApp();
    planMerchantId = await merchantIdBySlug(TEST_MERCHANT_PLAN_SLUG);
    singleMerchantId = await merchantIdBySlug(TEST_MERCHANT_SLUG);
    multiMerchantId = await merchantIdBySlug(TEST_MERCHANT_MULTI_SLUG);
    // limpa lojas extras de execuções anteriores (mantém só a fixture original).
    await masterPool.query(
      `DELETE FROM stores WHERE merchant_id = $1 AND slug NOT IN ('loja-ma6-plan-a')`,
      [planMerchantId],
    );
  });

  afterAll(async () => {
    await masterPool.query(
      `DELETE FROM stores WHERE merchant_id = $1 AND slug NOT IN ('loja-ma6-plan-a')`,
      [planMerchantId],
    );
    await app.close();
  });

  it('sem sessão → 401 UNAUTHORIZED', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/merchants/${planMerchantId}/stores`,
      payload: { slug: 'loja-ma6-sem-auth', name: 'Sem Auth' },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('UNAUTHORIZED');
  });

  it('membro operator → 403 FORBIDDEN (ação restrita ao owner)', async () => {
    const cookie = await login(app, TEST_MERCHANT_PLAN_OPERATOR_EMAIL, TEST_MERCHANT_PLAN_OPERATOR_SENHA);
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/merchants/${planMerchantId}/stores`,
      headers: { cookie },
      payload: { slug: 'loja-ma6-operator', name: 'Tentativa Operator' },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('FORBIDDEN');
  });

  it('owner tentando criar loja em conta de outro merchant → 403 FORBIDDEN', async () => {
    const cookie = await login(app, TEST_MERCHANT_PLAN_OWNER_EMAIL, TEST_MERCHANT_PLAN_OWNER_SENHA);
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/merchants/${multiMerchantId}/stores`,
      headers: { cookie },
      payload: { slug: 'loja-ma6-cross-merchant', name: 'Cross Merchant' },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('FORBIDDEN');
  });

  it('owner de conta com max_stores=1 já no limite → 403 STORE_LIMIT_REACHED', async () => {
    const cookie = await login(app, TEST_MERCHANT_OWNER_EMAIL, TEST_MERCHANT_OWNER_SENHA);
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/merchants/${singleMerchantId}/stores`,
      headers: { cookie },
      payload: { slug: 'loja-ma6-limite-starter', name: 'Loja Extra' },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('STORE_LIMIT_REACHED');
  });

  it('slug de loja já usado globalmente → 409 SLUG_EXISTS', async () => {
    const cookie = await login(app, TEST_MERCHANT_PLAN_OWNER_EMAIL, TEST_MERCHANT_PLAN_OWNER_SENHA);
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/merchants/${planMerchantId}/stores`,
      headers: { cookie },
      payload: { slug: TEST_MERCHANT_STORE_SLUG, name: 'Duplicada' },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe('SLUG_EXISTS');
  });

  it('owner cria loja #2 dentro do limite do plano (201)', async () => {
    const cookie = await login(app, TEST_MERCHANT_PLAN_OWNER_EMAIL, TEST_MERCHANT_PLAN_OWNER_SENHA);
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/merchants/${planMerchantId}/stores`,
      headers: { cookie },
      payload: { slug: 'loja-ma6-plan-b', name: 'Loja MA6 Plano B' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.slug).toBe('loja-ma6-plan-b');
    expect(res.json().data.merchantId).toBe(planMerchantId);

    // reflete em GET /auth/my-stores (O(1), spec §2.5 Merchant Hub).
    const myStores = await app.inject({ method: 'GET', url: '/api/v1/auth/my-stores', headers: { cookie } });
    expect(myStores.json().data.stores.map((s: { slug: string }) => s.slug).sort()).toEqual(
      ['loja-ma6-plan-a', 'loja-ma6-plan-b'].sort(),
    );
  });

  it('loja #3 excede max_stores do plano → 403 STORE_LIMIT_REACHED', async () => {
    expect(TEST_MERCHANT_PLAN_MAX_STORES).toBe(2);
    const cookie = await login(app, TEST_MERCHANT_PLAN_OWNER_EMAIL, TEST_MERCHANT_PLAN_OWNER_SENHA);
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/merchants/${planMerchantId}/stores`,
      headers: { cookie },
      payload: { slug: 'loja-ma6-plan-c', name: 'Loja MA6 Plano C' },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('STORE_LIMIT_REACHED');
  });
});
