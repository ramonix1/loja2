import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { TENANT_HEADER } from '../helpers/session.js';

describe('GET /api/v1/tenant/config', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('retorna a config da loja (200 + data.nome)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tenant/config',
      headers: { ...TENANT_HEADER },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.nome).toBeTruthy();
    expect(body.data.cor_primaria).toBeTruthy();
  });
});
