import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { loginUserCookie, TENANT_HEADER } from '../helpers/session.js';

describe('Shipping calculate', () => {
  let app: FastifyInstance;
  let userCookie: string;

  beforeAll(async () => {
    app = await buildTestApp();
    userCookie = await loginUserCookie(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST calcular CEP válido: 200, opções frete', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/shipping/calculate',
      headers: { ...TENANT_HEADER, cookie: userCookie, 'content-type': 'application/json' },
      payload: { cep_destino: '01310-100', subtotal: 50 },
    });
    expect(res.statusCode).toBe(200);
    const opcoes = res.json().data.opcoes;
    expect(Array.isArray(opcoes)).toBe(true);
    expect(opcoes.length).toBeGreaterThan(0);
    expect(opcoes[0]).toHaveProperty('valor');
  });
});
