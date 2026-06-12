import type { FastifyInstance } from 'fastify';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { clearUserCart, seedPedidoViaCheckout } from '../helpers/seed-order.js';
import { TEST_TENANT_SLUG } from '../helpers/seed.js';

describe('Billing commission', () => {
  let app: FastifyInstance;
  let pool: pg.Pool;

  beforeAll(async () => {
    app = await buildTestApp();
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it('após checkout pago: linha em commission_transactions', async () => {
    const { pedidoId } = await seedPedidoViaCheckout(app);

    const tenantRes = await pool.query('SELECT id FROM tenants WHERE slug = $1', [TEST_TENANT_SLUG]);
    const tenantId = tenantRes.rows[0]?.id;

    const r = await pool.query(
      'SELECT * FROM commission_transactions WHERE tenant_id = $1 AND pedido_id = $2',
      [tenantId, pedidoId],
    );

    expect(r.rows.length).toBeGreaterThan(0);
    expect(parseFloat(String(r.rows[0]?.commission_amount))).toBeGreaterThan(0);
  });
});
