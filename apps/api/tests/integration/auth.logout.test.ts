import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { TENANT_HEADER, loginAdminCookie } from '../helpers/session.js';

describe('POST /api/v1/auth/logout', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('limpa a sessão (GET /me passa a retornar 401)', async () => {
    const cookie = await loginAdminCookie(app);

    const logoutRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      headers: { ...TENANT_HEADER, cookie },
    });
    expect(logoutRes.statusCode).toBe(200);

    const meRes = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { ...TENANT_HEADER, cookie },
    });
    expect(meRes.statusCode).toBe(401);
  });
});
