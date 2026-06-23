import type { FastifyInstance } from 'fastify';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { TEST_TENANT_SLUG } from '../helpers/seed.js';

const SIGNUP_SLUG = 'signup-test-loja';
const SIGNUP_SLUG_2 = 'signup-test-loja2';
const SIGNUP_ADMIN_EMAIL = 'signup-admin@test.local';
const SIGNUP_ADMIN_EMAIL_2 = 'signup-admin2@test.local';

function connection(): pg.Pool {
  const connectionString =
    process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/lojao';
  return new pg.Pool({ connectionString, ssl: false });
}

async function cleanup(): Promise<void> {
  const pool = connection();
  try {
    // tenant_billing tem ON DELETE CASCADE a partir de tenants.
    await pool.query('DELETE FROM tenants WHERE slug = ANY($1)', [[SIGNUP_SLUG, SIGNUP_SLUG_2]]);
    await pool.query('DELETE FROM usuarios WHERE email = ANY($1)', [
      [SIGNUP_ADMIN_EMAIL, SIGNUP_ADMIN_EMAIL_2],
    ]);
  } finally {
    await pool.end();
  }
}

function signupPayload(over: Record<string, unknown> = {}) {
  return {
    planSlug: 'professional',
    billingCycle: 'monthly',
    trial: true,
    loja: { nome: 'Loja Signup Teste', slug: SIGNUP_SLUG },
    admin: { nome: 'Admin Signup', email: SIGNUP_ADMIN_EMAIL, senha: 'senha-forte-123' },
    ...over,
  };
}

describe('Onboarding self-service /api/v1/public/signup', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await cleanup();
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
    await cleanup();
  });

  it('GET /public/signup/plans retorna 3 planos', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/public/signup/plans' });
    expect(res.statusCode).toBe(200);
    const data = res.json().data as { slug: string }[];
    expect(data).toHaveLength(3);
    expect(data.map((p) => p.slug)).toEqual(['starter', 'professional', 'enterprise']);
  });

  it('GET /public/signup/check-slug: reservado, ocupado e disponível', async () => {
    const reserved = await app.inject({
      method: 'GET',
      url: '/api/v1/public/signup/check-slug?slug=admin',
    });
    expect(reserved.statusCode).toBe(200);
    expect(reserved.json().data.available).toBe(false);
    expect(reserved.json().data.reason).toBe('RESERVED');

    const taken = await app.inject({
      method: 'GET',
      url: `/api/v1/public/signup/check-slug?slug=${TEST_TENANT_SLUG}`,
    });
    expect(taken.json().data.available).toBe(false);
    expect(taken.json().data.reason).toBe('TAKEN');

    const free = await app.inject({
      method: 'GET',
      url: `/api/v1/public/signup/check-slug?slug=${SIGNUP_SLUG}`,
    });
    expect(free.json().data.available).toBe(true);
  });

  it('check-slug sem slug → 400', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/public/signup/check-slug' });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('VALIDATION_ERROR');
  });

  it('POST /public/signup/preview valida sem persistir', async () => {
    const ok = await app.inject({
      method: 'POST',
      url: '/api/v1/public/signup/preview',
      payload: signupPayload(),
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().data.valid).toBe(true);

    // não persistiu nada
    const pool = connection();
    try {
      const t = await pool.query('SELECT 1 FROM tenants WHERE slug = $1', [SIGNUP_SLUG]);
      expect(t.rows).toHaveLength(0);
    } finally {
      await pool.end();
    }
  });

  it('preview rejeita senha curta → 400 VALIDATION_ERROR', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/signup/preview',
      payload: signupPayload({ admin: { nome: 'X', email: 'a@b.com', senha: '123' } }),
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('VALIDATION_ERROR');
  });

  it('preview de slug reservado → 409 SLUG_RESERVED', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/signup/preview',
      payload: signupPayload({ loja: { nome: 'Reservada', slug: 'admin' } }),
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe('SLUG_RESERVED');
  });

  it('Enterprise não auto-provisiona → 422 ENTERPRISE_CONTACT', async () => {
    const preview = await app.inject({
      method: 'POST',
      url: '/api/v1/public/signup/preview',
      payload: signupPayload({ planSlug: 'enterprise' }),
    });
    expect(preview.statusCode).toBe(422);
    expect(preview.json().code).toBe('ENTERPRISE_CONTACT');

    const signup = await app.inject({
      method: 'POST',
      url: '/api/v1/public/signup',
      payload: signupPayload({
        planSlug: 'enterprise',
        loja: { nome: 'Enterprise Co', slug: SIGNUP_SLUG_2 },
        admin: { nome: 'Ent Admin', email: SIGNUP_ADMIN_EMAIL_2, senha: 'senha-forte-123' },
      }),
    });
    expect(signup.statusCode).toBe(422);
    expect(signup.json().code).toBe('ENTERPRISE_CONTACT');
  });

  it('POST /public/signup happy path: tenant + admin + trial', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/signup',
      payload: signupPayload(),
    });
    expect(res.statusCode).toBe(201);
    const data = res.json().data;
    expect(data.tenantSlug).toBe(SIGNUP_SLUG);
    expect(data.adminEmail).toBe(SIGNUP_ADMIN_EMAIL);
    expect(data.storefrontUrl).toContain(`/store/${SIGNUP_SLUG}`);
    expect(data.adminUrl).toContain('/login');
    expect(typeof data.trialEndsAt).toBe('string');

    const pool = connection();
    try {
      const tenant = await pool.query<{ id: number }>('SELECT id FROM tenants WHERE slug = $1', [
        SIGNUP_SLUG,
      ]);
      expect(tenant.rows).toHaveLength(1);

      const billing = await pool.query<{ status: string; trial_ends_at: Date | null }>(
        'SELECT status, trial_ends_at FROM tenant_billing WHERE tenant_id = $1',
        [tenant.rows[0]!.id],
      );
      expect(billing.rows).toHaveLength(1);
      expect(billing.rows[0]!.status).toBe('trialing');
      expect(billing.rows[0]!.trial_ends_at).not.toBeNull();

      const admin = await pool.query("SELECT role FROM usuarios WHERE email = $1", [
        SIGNUP_ADMIN_EMAIL,
      ]);
      expect(admin.rows[0]!.role).toBe('admin');
    } finally {
      await pool.end();
    }
  });

  it('slug duplicado → 409 SLUG_EXISTS', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/signup',
      // mesmo slug, e-mail diferente para não cair na idempotência
      payload: signupPayload({
        admin: { nome: 'Outro', email: 'outro-signup@test.local', senha: 'senha-forte-123' },
      }),
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe('SLUG_EXISTS');
  });

  it('idempotência via Idempotency-Key retorna mesmo resultado', async () => {
    const key = 'test-idem-key-abc';
    const payload = signupPayload({
      loja: { nome: 'Loja Idem', slug: SIGNUP_SLUG_2 },
      admin: { nome: 'Idem', email: SIGNUP_ADMIN_EMAIL_2, senha: 'senha-forte-123' },
    });

    const first = await app.inject({
      method: 'POST',
      url: '/api/v1/public/signup',
      headers: { 'idempotency-key': key },
      payload,
    });
    expect(first.statusCode).toBe(201);

    const second = await app.inject({
      method: 'POST',
      url: '/api/v1/public/signup',
      headers: { 'idempotency-key': key },
      payload,
    });
    expect(second.statusCode).toBe(201);
    expect(second.json().data.tenantSlug).toBe(first.json().data.tenantSlug);

    // apenas um tenant criado
    const pool = connection();
    try {
      const t = await pool.query('SELECT id FROM tenants WHERE slug = $1', [SIGNUP_SLUG_2]);
      expect(t.rows).toHaveLength(1);
    } finally {
      await pool.end();
    }
  });
});
