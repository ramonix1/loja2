import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { FastifyInstance } from 'fastify';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { TEST_TENANT_SLUG, TEST_USER_EMAIL } from '../helpers/seed.js';
import { TENANT_HEADER } from '../helpers/session.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const stripeFixture = JSON.parse(
  readFileSync(join(__dirname, '../fixtures/stripe-event.json'), 'utf-8'),
);

describe('Webhook Stripe', () => {
  let app: FastifyInstance;
  let pool: pg.Pool;
  let pedidoId: number;
  const paymentIntentId = 'pi_test_fixture_001';

  beforeAll(async () => {
    app = await buildTestApp();
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: false });

    await pool.query('DELETE FROM pagamentos WHERE mp_payment_id = $1', [paymentIntentId]);
    await pool.query('DELETE FROM webhook_events WHERE event_id = $1', [stripeFixture.id]);

    const userRes = await pool.query('SELECT id FROM usuarios WHERE email = $1', [TEST_USER_EMAIL]);
    const userId = userRes.rows[0]?.id;

    const pedidoRes = await pool.query(
      `INSERT INTO pedidos (usuario_id, status, subtotal, frete, total, metodo_pagamento, nome_entrega, email_entrega)
       VALUES ($1, 'aguardando_pagamento', 50, 0, 50, 'pix', 'Test', $2) RETURNING id`,
      [userId, TEST_USER_EMAIL],
    );
    pedidoId = pedidoRes.rows[0].id;

    await pool.query(
      `INSERT INTO pagamentos (pedido_id, mp_payment_id, status, status_mp, valor, metodo)
       VALUES ($1, $2, 'pendente', 'requires_payment_method', 50, 'pix')`,
      [pedidoId, paymentIntentId],
    );
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it('POST checkout.session.completed: pedido atualizado', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhook/stripe',
      headers: TENANT_HEADER,
      payload: stripeFixture,
    });
    expect(res.statusCode).toBe(200);

    const pedido = await pool.query('SELECT status FROM pedidos WHERE id = $1', [pedidoId]);
    expect(pedido.rows[0]?.status).toBe('pago');
  });

  it('repetir mesmo event_id: 200 sem duplicar processamento', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhook/stripe',
      headers: TENANT_HEADER,
      payload: stripeFixture,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().processed).toBe(false);

    const events = await pool.query(
      "SELECT COUNT(*) FROM webhook_events WHERE provider = 'stripe' AND event_id = $1",
      [stripeFixture.id],
    );
    expect(parseInt(String(events.rows[0]?.count), 10)).toBe(1);
  });
});
