import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { TENANT_HEADER } from '../helpers/session.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sumupFixture = JSON.parse(
  readFileSync(join(__dirname, '../fixtures/sumup-event.json'), 'utf-8'),
);

vi.mock('../../src/services/sumup.service.js', () => ({
  consultarCheckout: vi.fn().mockResolvedValue({ id: 'sumup_checkout_fixture_001', status: 'PAID' }),
  mapearStatus: vi.fn().mockReturnValue('pago'),
  criarCheckoutOnline: vi.fn(),
}));

describe('Webhook SumUp', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST evento SumUp: 200', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhook/sumup',
      headers: TENANT_HEADER,
      payload: sumupFixture,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().received).toBe(true);
  });
});
