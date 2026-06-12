import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { loginAdminCookie, loginUserCookie, TENANT_HEADER } from '../helpers/session.js';

describe('GET /api/v1/admin/diagnostico', () => {
  let app: FastifyInstance;
  let adminCookie: string;

  beforeAll(async () => {
    app = await buildTestApp();
    adminCookie = await loginAdminCookie(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET como admin: 200 com resultados', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/diagnostico',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data.resultados)).toBe(true);
    expect(body.data.resultados.length).toBeGreaterThanOrEqual(5);
    expect(body.data.resultados[0]).toMatchObject({
      nome: expect.any(String),
      ok: expect.any(Boolean),
      valor: expect.any(String),
    });
  });

  it('GET inclui checks de env conhecidos', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/diagnostico',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    const nomes = res.json().data.resultados.map((r: { nome: string }) => r.nome);
    expect(nomes).toContain('MP_ACCESS_TOKEN');
    expect(nomes).toContain('SUMUP_API_KEY');
    expect(nomes).toContain('APP_URL');
  });

  it('GET sem sessão: 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/diagnostico',
      headers: TENANT_HEADER,
    });
    expect(res.statusCode).toBe(401);
  });

  it('GET como comprador: 403', async () => {
    const cookie = await loginUserCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/diagnostico',
      headers: { ...TENANT_HEADER, cookie },
    });
    expect(res.statusCode).toBe(403);
  });
});
