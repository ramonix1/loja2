/**
 * Smoke de bootstrap — garante que a API sobe de verdade (imports/deps resolvíveis).
 * Falha cedo se faltar pacote (ex.: stripe) ou import quebrado (ex.: billing.service).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { loginAdminCookie, TENANT_HEADER } from '../helpers/session.js';

describe('API bootstrap @smoke', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health responde 200', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { status: string; service: string };
    expect(body.status).toBe('ok');
    expect(body.service).toBe('lojao-api');
  });

  it('POST /api/v1/auth/login responde 200', async () => {
    const cookie = await loginAdminCookie(app);
    expect(cookie).toMatch(/^lojao\.sid=/);

    const me = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { ...TENANT_HEADER, cookie },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().data.usuario.role).toBe('admin');
    expect(me.json().data.tenant.slug).toBe('loja');
  });
});
