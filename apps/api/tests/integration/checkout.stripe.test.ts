import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { CHECKOUT_ADDRESS, clearUserCart, seedCartItem } from '../helpers/seed-order.js';
import { loginUserCookie, TENANT_HEADER } from '../helpers/session.js';
import { getTestProdutoId } from '../helpers/fixture-ids.js';

vi.mock('../../src/services/stripe.service.js', () => ({
  criarPagamentoPix: vi.fn().mockResolvedValue({
    id: 'pi_mock_test',
    status: 'requires_action',
    next_action: { type: 'pix_display_qr_code' },
  }),
  criarPagamentoCartao: vi.fn(),
  criarBoleto: vi.fn(),
  mapearStatus: vi.fn().mockReturnValue('pendente'),
  consultarPagamento: vi.fn(),
  verifyWebhookSignature: vi.fn(),
}));

describe('Checkout Stripe (mock)', () => {
  let app: FastifyInstance;
  let userCookie: string;

  beforeAll(async () => {
    app = await buildTestApp();
    userCookie = await loginUserCookie(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST pix: pedido criado aguardando pagamento', async () => {
    await clearUserCart(app, userCookie);
    await seedCartItem(app, userCookie, getTestProdutoId(), { clearFirst: false });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/checkout',
      headers: { ...TENANT_HEADER, cookie: userCookie, 'content-type': 'application/json' },
      payload: { ...CHECKOUT_ADDRESS, metodo_pagamento: 'pix' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.status).toBe('aguardando_pagamento');
    expect(res.json().data.pedido_id).toBeGreaterThan(0);
  });
});
