import pg from 'pg';

import { merchantDbName, merchantPoolConfig } from '../../src/lib/merchant-provision.js';
import { getTestPedidoId, getTestProdutoId } from './fixture-ids.js';
import { TEST_PRIMARY_MERCHANT_SLUG } from './seed.js';

const { Pool } = pg;

/** Garante pedido entregue + review limpa — idempotente entre specs da suíte. */
export async function ensureReviewTestFixtures(): Promise<void> {
  const pedidoId = getTestPedidoId();
  const productId = getTestProdutoId();
  if (pedidoId <= 0 || productId <= 0) return;

  const pool = new Pool(merchantPoolConfig(merchantDbName(TEST_PRIMARY_MERCHANT_SLUG)));
  try {
    await pool.query(`UPDATE orders SET status = 'delivered' WHERE id = $1`, [pedidoId]);
    await pool.query(`UPDATE order_items SET product_id = $1 WHERE order_id = $2`, [
      productId,
      pedidoId,
    ]);
    await pool.query('DELETE FROM product_reviews WHERE product_id = $1', [productId]);
  } finally {
    await pool.end();
  }
}
