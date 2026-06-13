import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { TENANT_HEADER } from '../helpers/session.js';

describe('GET /api/v1/public/categories', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('retorna categorias com produtos', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/public/categories',
      headers: { ...TENANT_HEADER },
    });

    expect(res.statusCode).toBe(200);
    const { data } = res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
