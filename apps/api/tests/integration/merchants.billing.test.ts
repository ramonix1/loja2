import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { masterPool } from '../../src/lib/master-db.js';
import { merchantDbName } from '../../src/lib/merchant-provision.js';
import {
  recordCommissionOnMerchantOrder,
} from '../../src/services/merchant-billing.service.js';

/**
 * MA7 — billing por conta merchant (`merchant_billing`, faturas/comissão).
 * Rotas tenant legado (`/billing/*`) permanecem inalteradas — ver assunções
 * em docs/specs/merchant-account-STATUS.md.
 */
const MERCHANT_SLUG = 'ma7-billing-merchant';
const STORE_SLUG = 'ma7-billing-loja';
const OWNER_EMAIL = 'owner@ma7-billing.test.local';
const OWNER_SENHA = 'senha-forte-123';

async function dropMerchant(slug: string): Promise<void> {
  await masterPool.query('DELETE FROM merchants WHERE slug = $1', [slug]);
  await masterPool.query(`DROP DATABASE IF EXISTS "${merchantDbName(slug)}" WITH (FORCE)`);
}

async function cleanup(): Promise<void> {
  await dropMerchant(MERCHANT_SLUG);
}

async function signupMerchant(app: FastifyInstance): Promise<number> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/public/merchant-signup',
    payload: {
      planSlug: 'professional',
      merchant: { slug: MERCHANT_SLUG, name: 'Conta Billing MA7' },
      store: { slug: STORE_SLUG, name: 'Loja Billing MA7' },
      owner: { name: 'Dono MA7', email: OWNER_EMAIL, senha: OWNER_SENHA },
    },
  });
  expect(res.statusCode).toBe(201);
  const merchantRow = await masterPool.query<{ id: number }>(
    'SELECT id FROM merchants WHERE slug = $1',
    [MERCHANT_SLUG],
  );
  return merchantRow.rows[0]!.id;
}

async function loginMerchant(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: OWNER_EMAIL, senha: OWNER_SENHA },
  });
  expect(res.statusCode).toBe(200);
  const cookie = res.headers['set-cookie'];
  return Array.isArray(cookie) ? cookie.join('; ') : (cookie ?? '');
}

describe('Billing por merchant — MA7', () => {
  let app: FastifyInstance;
  let merchantId: number;

  beforeAll(async () => {
    await cleanup();
    app = await buildTestApp();
    merchantId = await signupMerchant(app);
  });

  afterAll(async () => {
    await app.close();
    await cleanup();
  });

  it('signup registra trial 14d em merchant_billing', async () => {
    const billing = await masterPool.query<{ status: string; trial_ends_at: Date | null }>(
      'SELECT status, trial_ends_at FROM merchant_billing WHERE merchant_id = $1',
      [merchantId],
    );
    expect(billing.rows).toHaveLength(1);
    expect(billing.rows[0]!.status).toBe('trialing');
    expect(billing.rows[0]!.trial_ends_at).not.toBeNull();

    const plan = await masterPool.query<{ slug: string }>(
      `SELECT bp.slug FROM merchant_billing mb
       JOIN billing_plans bp ON mb.plan_id = bp.id
       WHERE mb.merchant_id = $1`,
      [merchantId],
    );
    expect(plan.rows[0]!.slug).toBe('professional');
  });

  it('GET /merchants/billing/config retorna plano da conta autenticada', async () => {
    const cookie = await loginMerchant(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/merchants/billing/config',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    expect(data.plan_slug).toBe('professional');
    expect(data.status).toBe('trialing');
    expect(data.max_stores).toBe(3);
  });

  it('GET /merchants/billing/report retorna estrutura de relatório', async () => {
    const cookie = await loginMerchant(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/merchants/billing/report',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.month).toMatch(/^\d{4}-\d{2}$/);
    expect(res.json().data.orders).toBeDefined();
  });

  it('assign-plan Enterprise atualiza custom_max_stores e merchants.max_stores', async () => {
    const prevSuperAdmin = process.env.SUPER_ADMIN_EMAIL;
    process.env.SUPER_ADMIN_EMAIL = 'admin@loja.com';

    const adminRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'admin@loja.com', senha: 'admin123' },
    });
    expect(adminRes.statusCode).toBe(200);

    const assignRes = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/billing/merchants/${merchantId}/assign-plan`,
      headers: { cookie: adminRes.headers['set-cookie'] as string },
      payload: { planSlug: 'enterprise', customMaxStores: 10 },
    });
    expect(assignRes.statusCode).toBe(200);

    const merchantRow = await masterPool.query<{ max_stores: number }>(
      'SELECT max_stores FROM merchants WHERE id = $1',
      [merchantId],
    );
    expect(merchantRow.rows[0]!.max_stores).toBe(10);

    const billingRow = await masterPool.query<{ custom_max_stores: number; status: string }>(
      'SELECT custom_max_stores, status FROM merchant_billing WHERE merchant_id = $1',
      [merchantId],
    );
    expect(billingRow.rows[0]!.custom_max_stores).toBe(10);
    expect(billingRow.rows[0]!.status).toBe('active');

    process.env.SUPER_ADMIN_EMAIL = prevSuperAdmin;
  });

  it('recordCommissionOnMerchantOrder retorna null sem comissão no plano fixed', async () => {
    const result = await recordCommissionOnMerchantOrder(merchantId, 1, 100);
    expect(result).toBeNull();
  });
});
