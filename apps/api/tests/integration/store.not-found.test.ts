import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';

describe('Store inexistente', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('responde 404 STORE_NOT_FOUND para slug inexistente', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/store/config',
      headers: { 'x-store-slug': 'store-que-nao-existe-xyz' },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe('STORE_NOT_FOUND');
  });
});
