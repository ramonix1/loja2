import type { FastifyInstance } from 'fastify';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { extractSessionCookie, loginAdminCookie } from '../helpers/session.js';

const MASTER_EMAIL = 'master@test.local';
const MASTER_PASSWORD = 'master-secret-123';
const NEW_TENANT_SLUG = 'acme-test';

async function cleanupTenant(slug: string): Promise<void> {
  const connectionString =
    process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/lojao';
  const pool = new pg.Pool({ connectionString, ssl: false });
  try {
    await pool.query('DELETE FROM tenants WHERE slug = $1', [slug]);
  } finally {
    await pool.end();
  }
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
    await cleanupTenant(NEW_TENANT_SLUG);
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
    await cleanupTenant(NEW_TENANT_SLUG);
    if (prevEmail === undefined) delete process.env.MASTER_EMAIL;
    else process.env.MASTER_EMAIL = prevEmail;
    if (prevPassword === undefined) delete process.env.MASTER_PASSWORD;
    else process.env.MASTER_PASSWORD = prevPassword;
  });

  it('GET /platform/tenants exige autenticação (401)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/platform/tenants' });
    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('UNAUTHORIZED');
  });

  it('lojista autenticado não acessa platform (403 FORBIDDEN)', async () => {
    const cookie = await loginAdminCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/platform/tenants',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('FORBIDDEN');
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

  it('login master + CRUD de tenant (happy path)', async () => {
    const cookie = await platformLoginCookie(app);

    // lista inicial (loja seed presente)
    const listRes = await app.inject({
      method: 'GET',
      url: '/api/v1/platform/tenants',
      headers: { cookie },
    });
    expect(listRes.statusCode).toBe(200);
    expect(Array.isArray(listRes.json().data)).toBe(true);

    // cria tenant
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/platform/tenants',
      headers: { cookie },
      payload: { slug: NEW_TENANT_SLUG, nome: 'Acme Teste' },
    });
    expect(createRes.statusCode).toBe(201);
    expect(createRes.json().data.slug).toBe(NEW_TENANT_SLUG);
    expect(createRes.json().data.ativo).toBe(true);

    // duplicado → 409
    const dupRes = await app.inject({
      method: 'POST',
      url: '/api/v1/platform/tenants',
      headers: { cookie },
      payload: { slug: NEW_TENANT_SLUG, nome: 'Acme Dois' },
    });
    expect(dupRes.statusCode).toBe(409);
    expect(dupRes.json().code).toBe('SLUG_EXISTS');

    // detalhe
    const getRes = await app.inject({
      method: 'GET',
      url: `/api/v1/platform/tenants/${NEW_TENANT_SLUG}`,
      headers: { cookie },
    });
    expect(getRes.statusCode).toBe(200);
    expect(getRes.json().data.nome).toBe('Acme Teste');

    // suspende (patch)
    const patchRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/platform/tenants/${NEW_TENANT_SLUG}`,
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
      url: '/api/v1/platform/tenants',
      headers: { cookie },
      payload: { slug: 'Slug Inválido!', nome: 'X' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('VALIDATION_ERROR');
  });

  it('404 para tenant inexistente', async () => {
    const cookie = await platformLoginCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/platform/tenants/nao-existe-xyz',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe('NOT_FOUND');
  });
});
