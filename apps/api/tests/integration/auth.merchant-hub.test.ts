import type { FastifyInstance } from 'fastify';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { extractSessionCookie, loginAdminCookie, TENANT_HEADER } from '../helpers/session.js';
import { TEST_ADMIN_EMAIL, TEST_ADMIN_SENHA, TEST_TENANT_SLUG } from '../helpers/seed.js';

const SECOND_TENANT_SLUG = 'loja-hub-b';

async function ensureSecondTenant(): Promise<void> {
  const connectionString =
    process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/lojao';
  const pool = new pg.Pool({ connectionString, ssl: false });
  try {
    const url = new URL(connectionString);
    await pool.query(
      `INSERT INTO tenants (slug, nome, db_host, db_port, db_name, db_user, db_password, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       ON CONFLICT (slug) DO UPDATE SET ativo = true, nome = EXCLUDED.nome`,
      [
        SECOND_TENANT_SLUG,
        'Loja Hub B',
        url.hostname,
        Number.parseInt(url.port, 10) || 5432,
        url.pathname.replace(/^\//, ''),
        url.username,
        decodeURIComponent(url.password),
      ],
    );
  } finally {
    await pool.end();
  }
}

describe('Merchant Hub — POST /api/v1/auth/login (sem slug)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('login sem slug retorna step ready ou select_tenant', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_ADMIN_EMAIL, senha: TEST_ADMIN_SENHA },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(['ready', 'select_tenant']).toContain(body.data.step);
    expect(body.data.user.email).toBe(TEST_ADMIN_EMAIL);

    const setCookie = res.headers['set-cookie'];
    const cookieStr = Array.isArray(setCookie) ? setCookie.join(';') : setCookie;
    expect(cookieStr).toContain('lojao.sid=');

    if (body.data.step === 'ready') {
      expect(body.data.tenant.slug).toBeTruthy();
      const me = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: { cookie: extractSessionCookie(res) },
      });
      expect(me.json().data.tenant.slug).toBe(body.data.tenant.slug);
    } else {
      expect(body.data.stores.length).toBeGreaterThanOrEqual(2);
      const me = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: { cookie: extractSessionCookie(res) },
      });
      expect(me.json().data.tenant).toBeNull();
    }
  });

  it('multi-loja retorna step select_tenant sem tenant na sessão', async () => {
    await ensureSecondTenant();

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_ADMIN_EMAIL, senha: TEST_ADMIN_SENHA },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.step).toBe('select_tenant');
    expect(body.data.stores.length).toBeGreaterThanOrEqual(2);

    const me = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { cookie: extractSessionCookie(res) },
    });
    expect(me.json().data.tenant).toBeNull();
  });

  it('e-mail sem loja admin retorna 403 NO_TENANT_ACCESS', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'sem-loja@example.com', senha: 'qualquer' },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('NO_TENANT_ACCESS');
  });

  it('login com tenantSlug explícito mantém compatibilidade (step ready)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: TEST_ADMIN_EMAIL,
        senha: TEST_ADMIN_SENHA,
        tenantSlug: TEST_TENANT_SLUG,
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.step).toBe('ready');
    expect(res.json().data.tenant.slug).toBe(TEST_TENANT_SLUG);
  });
});

describe('Merchant Hub — select-tenant, my-stores, guards', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
    await ensureSecondTenant();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /auth/my-stores lista lojas do admin autenticado', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_ADMIN_EMAIL, senha: TEST_ADMIN_SENHA },
    });
    const cookie = extractSessionCookie(loginRes);

    if (loginRes.json().data.step === 'ready') {
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/clear-tenant',
        headers: { cookie },
      });
    }

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/my-stores',
      headers: { cookie },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.stores.length).toBeGreaterThanOrEqual(2);
    expect(res.json().data.stores[0]).toMatchObject({
      slug: expect.any(String),
      lojaNome: expect.any(String),
    });
  });

  it('POST /auth/select-tenant seta tenant na sessão', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_ADMIN_EMAIL, senha: TEST_ADMIN_SENHA },
    });
    let cookie = extractSessionCookie(loginRes);

    if (loginRes.json().data.step === 'ready') {
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/clear-tenant',
        headers: { cookie },
      });
    }

    const selectRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/select-tenant',
      headers: { cookie },
      payload: { tenantSlug: TEST_TENANT_SLUG },
    });

    expect(selectRes.statusCode).toBe(200);
    cookie = extractSessionCookie(selectRes);

    const me = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { cookie },
    });
    expect(me.json().data.tenant.slug).toBe(TEST_TENANT_SLUG);
  });

  it('rota admin sem tenant selecionado retorna 403 TENANT_NOT_SELECTED', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_ADMIN_EMAIL, senha: TEST_ADMIN_SENHA },
    });
    const cookie = extractSessionCookie(loginRes);

    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/clear-tenant',
      headers: { cookie },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/dashboard/stats',
      headers: { cookie, ...TENANT_HEADER },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('TENANT_NOT_SELECTED');
  });

  it('loginAdminCookie helper continua funcionando', async () => {
    const cookie = await loginAdminCookie(app);
    const me = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { cookie },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().data.tenant.slug).toBe(TEST_TENANT_SLUG);
  });
});
