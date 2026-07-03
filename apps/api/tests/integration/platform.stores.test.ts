import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { merchantDbName } from '../../src/lib/merchant-provision.js';
import { masterPool } from '../../src/lib/master-db.js';
import { extractSessionCookie, loginAdminCookie } from '../helpers/session.js';
import { TEST_STORE_SLUG } from '../helpers/seed.js';

const MASTER_EMAIL = 'master@test.local';
const MASTER_PASSWORD = 'master-secret-123';
const NEW_STORE_SLUG = 'acme-test';

async function cleanupMerchant(slug: string): Promise<void> {
  await masterPool.query('DELETE FROM merchants WHERE slug = $1', [slug]);
  await masterPool.query(`DROP DATABASE IF EXISTS "${merchantDbName(slug)}" WITH (FORCE)`);
}

/** Login da plataforma; retorna o cookie de sessão platform_admin. */
async function platformLoginCookie(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/platform/login',
    payload: { email: MASTER_EMAIL, senha: MASTER_PASSWORD },
  });
  if (res.statusCode !== 200) {
    throw new Error(`Platform login falhou (${res.statusCode}): ${res.body}`);
  }
  return extractSessionCookie(res);
}

describe('Platform Hub /api/v1/platform/*', () => {
  let app: FastifyInstance;
  const prevEmail = process.env.MASTER_EMAIL;
  const prevPassword = process.env.MASTER_PASSWORD;

  beforeAll(async () => {
    process.env.MASTER_EMAIL = MASTER_EMAIL;
    process.env.MASTER_PASSWORD = MASTER_PASSWORD;
    await cleanupMerchant(NEW_STORE_SLUG);
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
    await cleanupMerchant(NEW_STORE_SLUG);
    if (prevEmail === undefined) delete process.env.MASTER_EMAIL;
    else process.env.MASTER_EMAIL = prevEmail;
    if (prevPassword === undefined) delete process.env.MASTER_PASSWORD;
    else process.env.MASTER_PASSWORD = prevPassword;
  });

  it('GET /platform/stores exige autenticação (401)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/platform/stores' });
    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('UNAUTHORIZED');
  });

  it('lojista autenticado não acessa platform (401 — sessão merchant, não platform_admin)', async () => {
    const cookie = await loginAdminCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/platform/stores',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('UNAUTHORIZED');
  });

  it('rejeita login da plataforma com credenciais inválidas (401)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/platform/login',
      payload: { email: MASTER_EMAIL, senha: 'errada' },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('UNAUTHORIZED');
  });

  it('login master + CRUD de loja (happy path)', async () => {
    const cookie = await platformLoginCookie(app);

    const listRes = await app.inject({
      method: 'GET',
      url: '/api/v1/platform/stores',
      headers: { cookie },
    });
    expect(listRes.statusCode).toBe(200);
    expect(Array.isArray(listRes.json().data)).toBe(true);

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/platform/stores',
      headers: { cookie },
      payload: { slug: NEW_STORE_SLUG, nome: 'Acme Teste' },
    });
    expect(createRes.statusCode).toBe(201);
    expect(createRes.json().data.slug).toBe(NEW_STORE_SLUG);
    expect(createRes.json().data.ativo).toBe(true);

    const dupRes = await app.inject({
      method: 'POST',
      url: '/api/v1/platform/stores',
      headers: { cookie },
      payload: { slug: NEW_STORE_SLUG, nome: 'Acme Dois' },
    });
    expect(dupRes.statusCode).toBe(409);
    expect(dupRes.json().code).toBe('SLUG_EXISTS');

    const getRes = await app.inject({
      method: 'GET',
      url: `/api/v1/platform/stores/${NEW_STORE_SLUG}`,
      headers: { cookie },
    });
    expect(getRes.statusCode).toBe(200);
    expect(getRes.json().data.nome).toBe('Acme Teste');

    const patchRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/platform/stores/${NEW_STORE_SLUG}`,
      headers: { cookie },
      payload: { ativo: false },
    });
    expect(patchRes.statusCode).toBe(200);
    expect(patchRes.json().data.ativo).toBe(false);
  });

  it('rejeita slug inválido na criação (400 VALIDATION_ERROR)', async () => {
    const cookie = await platformLoginCookie(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/platform/stores',
      headers: { cookie },
      payload: { slug: 'Slug Inválido!', nome: 'X' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('VALIDATION_ERROR');
  });

  it('404 para loja inexistente', async () => {
    const cookie = await platformLoginCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/platform/stores/nao-existe-xyz',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe('NOT_FOUND');
  });

  it('GET /platform/dashboard/stats retorna KPIs master', async () => {
    const cookie = await platformLoginCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/platform/dashboard/stats',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    expect(typeof data.totalStores).toBe('number');
    expect(typeof data.activeStores).toBe('number');
    expect(typeof data.suspendedStores).toBe('number');
    expect(typeof data.newStores30d).toBe('number');
    expect(typeof data.totalMerchants).toBe('number');
    expect(data.orders30d).toBeNull();
  });

  it('GET /platform/dashboard/charts retorna séries operacionais', async () => {
    const cookie = await platformLoginCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/platform/dashboard/charts?periodo=30d',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    expect(data.periodo).toBe('30d');
    expect(Array.isArray(data.lojas_por_dia)).toBe(true);
    expect(Array.isArray(data.saude_lojas)).toBe(true);
    expect(Array.isArray(data.billing_merchants)).toBe(true);
    expect(Array.isArray(data.lojas_por_plano)).toBe(true);
    expect(data.lojas_por_dia.length).toBeGreaterThan(0);
  });

  it('GET /platform/dashboard/charts periodo invalido: 400', async () => {
    const cookie = await platformLoginCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/platform/dashboard/charts?periodo=365d',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('VALIDATION_ERROR');
  });

  it('GET /platform/stores com paginação retorna meta', async () => {
    const cookie = await platformLoginCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/platform/stores?page=1&limit=5',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
    expect(res.json().meta).toMatchObject({ page: 1, perPage: 5 });
    expect(typeof res.json().meta.total).toBe('number');
  });

  it('GET /platform/stores filtra por status=active e por busca (q)', async () => {
    const cookie = await platformLoginCookie(app);

    const activeRes = await app.inject({
      method: 'GET',
      url: '/api/v1/platform/stores?status=active&limit=100',
      headers: { cookie },
    });
    expect(activeRes.statusCode).toBe(200);
    for (const item of activeRes.json().data) {
      expect(item.ativo).toBe(true);
    }

    const qRes = await app.inject({
      method: 'GET',
      url: `/api/v1/platform/stores?q=${NEW_STORE_SLUG}`,
      headers: { cookie },
    });
    expect(qRes.statusCode).toBe(200);
    expect(qRes.json().data.some((item: { slug: string }) => item.slug === NEW_STORE_SLUG)).toBe(
      true,
    );
  });

  it('GET /platform/stores filtra por plano', async () => {
    const cookie = await platformLoginCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/platform/stores?plano=starter&limit=100',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    for (const item of res.json().data) {
      expect(item.plano).toBe('starter');
    }
  });

  it('GET /platform/merchants exige autenticação (401)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/platform/merchants' });
    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('UNAUTHORIZED');
  });

  it('GET /platform/merchants retorna lista paginada com storesCount', async () => {
    const cookie = await platformLoginCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/platform/merchants?page=1&limit=10',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
    expect(res.json().meta).toMatchObject({ page: 1, perPage: 10 });

    const created = res
      .json()
      .data.find((item: { slug: string }) => item.slug === NEW_STORE_SLUG);
    expect(created).toBeDefined();
    expect(typeof created.storesCount).toBe('number');
    expect(created.storesCount).toBeGreaterThanOrEqual(1);
  });

  it('GET /platform/merchants filtra por busca (q) e por status', async () => {
    const cookie = await platformLoginCookie(app);

    const qRes = await app.inject({
      method: 'GET',
      url: `/api/v1/platform/merchants?q=${NEW_STORE_SLUG}`,
      headers: { cookie },
    });
    expect(qRes.statusCode).toBe(200);
    expect(qRes.json().data.some((item: { slug: string }) => item.slug === NEW_STORE_SLUG)).toBe(
      true,
    );

    const statusRes = await app.inject({
      method: 'GET',
      url: '/api/v1/platform/merchants?status=active&limit=100',
      headers: { cookie },
    });
    expect(statusRes.statusCode).toBe(200);
    for (const item of statusRes.json().data) {
      expect(item.ativo).toBe(true);
    }
  });

  it('GET /platform/stores/:slug retorna detalhe enriquecido com merchant', async () => {
    const cookie = await platformLoginCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/platform/stores/${NEW_STORE_SLUG}`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    expect(data.slug).toBe(NEW_STORE_SLUG);
    expect(data.merchantId).toBeTypeOf('number');
    expect(data.merchantSlug).toBe(NEW_STORE_SLUG);
    expect(data.health).toMatch(/healthy|attention|suspended/);
  });

  it('GET /platform/stores/:slug/metrics e /billing retornam 200', async () => {
    const cookie = await platformLoginCookie(app);

    const metricsRes = await app.inject({
      method: 'GET',
      url: `/api/v1/platform/stores/${NEW_STORE_SLUG}/metrics`,
      headers: { cookie },
    });
    expect(metricsRes.statusCode).toBe(200);
    expect(metricsRes.json().data.health).toBeDefined();
    expect(Array.isArray(metricsRes.json().data.healthReasons)).toBe(true);

    const billingRes = await app.inject({
      method: 'GET',
      url: `/api/v1/platform/stores/${NEW_STORE_SLUG}/billing`,
      headers: { cookie },
    });
    expect(billingRes.statusCode).toBe(200);
    expect(billingRes.json().data).toMatchObject({
      invoicesCount: expect.any(Number),
    });
  });

  it('GET /platform/health e /platform/reports retornam resumo', async () => {
    const cookie = await platformLoginCookie(app);

    const healthRes = await app.inject({
      method: 'GET',
      url: '/api/v1/platform/health',
      headers: { cookie },
    });
    expect(healthRes.statusCode).toBe(200);
    expect(healthRes.json().data).toMatchObject({
      healthyStores: expect.any(Number),
      attentionStores: expect.any(Number),
      suspendedStores: expect.any(Number),
      trialsExpiring7d: expect.any(Number),
      items: expect.any(Array),
    });

    const reportsRes = await app.inject({
      method: 'GET',
      url: '/api/v1/platform/reports',
      headers: { cookie },
    });
    expect(reportsRes.statusCode).toBe(200);
    expect(reportsRes.json().data).toMatchObject({
      totalMerchants: expect.any(Number),
      recentStores: expect.any(Array),
    });
  });

  it('GET /platform/dashboard/stats inclui trialsExpiring7d', async () => {
    const cookie = await platformLoginCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/platform/dashboard/stats',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.trialsExpiring7d).toBeTypeOf('number');
  });

  it('impersonate + end-impersonation restaura platform_admin (merchant pode encerrar)', async () => {
    const platformCookie = await platformLoginCookie(app);

    const impersonateRes = await app.inject({
      method: 'POST',
      url: `/api/v1/platform/stores/${TEST_STORE_SLUG}/impersonate`,
      headers: { cookie: platformCookie },
      payload: {},
    });
    expect(impersonateRes.statusCode).toBe(200);
    const merchantCookie = extractSessionCookie(impersonateRes);

    const meAsMerchant = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { cookie: merchantCookie },
    });
    expect(meAsMerchant.statusCode).toBe(200);
    expect(meAsMerchant.json().data.usuario.role).toBe('owner');
    expect(meAsMerchant.json().data.impersonation?.storeSlug).toBe(TEST_STORE_SLUG);

    const endRes = await app.inject({
      method: 'POST',
      url: '/api/v1/platform/end-impersonation',
      headers: { cookie: merchantCookie, 'x-auth-context': 'platform' },
      payload: {},
    });
    expect(endRes.statusCode).toBe(200);

    const sessionCookie = endRes.headers['set-cookie']
      ? extractSessionCookie(endRes)
      : merchantCookie;

    const meAsPlatform = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { cookie: sessionCookie },
    });
    expect(meAsPlatform.statusCode).toBe(200);
    expect(meAsPlatform.json().data.usuario.role).toBe('platform_admin');
    expect(meAsPlatform.json().data.impersonation).toBeNull();

    const storesRes = await app.inject({
      method: 'GET',
      url: '/api/v1/platform/stores',
      headers: { cookie: sessionCookie },
    });
    expect(storesRes.statusCode).toBe(200);
  });
});
