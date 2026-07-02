import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runMigrations } from '@lojao/db';
import { DEFAULT_LOJA_COR_PRIMARIA } from '@lojao/types/aparencia';
import argon2 from 'argon2';
import pg from 'pg';

import {
  ensureMerchantDatabase,
  merchantDbName,
  merchantPoolConfig,
} from '../../src/lib/merchant-provision.js';
import {
  createMerchant,
  createStoreForMerchant,
} from '../../src/modules/merchants/merchant.service.js';

const { Pool } = pg;

export const TEST_STORE_SLUG = 'loja';
/** Alias legado — preferir `TEST_STORE_SLUG` em testes novos (MA8). */
export const TEST_TENANT_SLUG = TEST_STORE_SLUG;

export const TEST_PRIMARY_MERCHANT_SLUG = 'test-loja';
export const TEST_ADMIN_EMAIL = 'admin@loja.com';
export const TEST_ADMIN_SENHA = 'admin123';
export const TEST_USER_EMAIL = 'comprador-test@loja.com';
export const TEST_USER_SENHA = 'comprador123';

/** MA5 — conta merchant de teste com 1 única loja ativa (login deve auto-selecionar, step `ready`). */
export const TEST_MERCHANT_SLUG = 'merchant-ma5';
export const TEST_MERCHANT_OWNER_EMAIL = 'owner@merchant-ma5.com';
export const TEST_MERCHANT_OWNER_SENHA = 'owner12345';
export const TEST_MERCHANT_STORE_SLUG = 'loja-ma5-unica';

/** MA5 — conta merchant de teste com 2 lojas ativas (login deve retornar step `select_store`). */
export const TEST_MERCHANT_MULTI_SLUG = 'merchant-ma5-multi';
export const TEST_MERCHANT_MULTI_OWNER_EMAIL = 'owner@merchant-ma5-multi.com';
export const TEST_MERCHANT_MULTI_OWNER_SENHA = 'owner12345';
export const TEST_MERCHANT_MULTI_STORE_A_SLUG = 'loja-ma5-multi-a';
export const TEST_MERCHANT_MULTI_STORE_B_SLUG = 'loja-ma5-multi-b';

/**
 * MA6 — conta merchant de teste plano Professional (`max_stores=2`) com 1
 * loja ativa: usada para provar `POST /merchants/:id/stores` (loja #2 ok,
 * loja #3 → 403 `STORE_LIMIT_REACHED`) e o guard `requireMerchantOwner`
 * (membro `operator` → 403 `FORBIDDEN`).
 */
export const TEST_MERCHANT_PLAN_SLUG = 'merchant-ma6-plan';
export const TEST_MERCHANT_PLAN_MAX_STORES = 2;
export const TEST_MERCHANT_PLAN_OWNER_EMAIL = 'owner@merchant-ma6-plan.com';
export const TEST_MERCHANT_PLAN_OWNER_SENHA = 'owner12345';
export const TEST_MERCHANT_PLAN_OPERATOR_EMAIL = 'operator@merchant-ma6-plan.com';
export const TEST_MERCHANT_PLAN_OPERATOR_SENHA = 'operator12345';
export const TEST_MERCHANT_PLAN_STORE_SLUG = 'loja-ma6-plan-a';

/** Pedido de teste criado no merchant DB (id estável após seed). */
export let TEST_PEDIDO_ID = 0;
/** Produto de teste para cart/checkout (id estável após seed). */
export let TEST_PRODUTO_ID = 0;
/** Produto com estoque limitado para teste 409. */
export let TEST_PRODUTO_ESTOQUE_ID = 0;

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
} as const;

function parseConnectionUrl(connectionString: string): {
  host: string;
  port: number;
  user: string;
  password: string;
} {
  const url = new URL(connectionString);
  return {
    host: url.hostname,
    port: Number.parseInt(url.port, 10) || 5432,
    user: url.username,
    password: decodeURIComponent(url.password),
  };
}

/**
 * Prepara o banco de testes MA8 (idempotente). Aplica migrations Drizzle no
 * master (sem tabelas tenant legado após 0005), provisiona merchant `test-loja`
 * + loja `loja`, fixtures EN no banco `atacommerce_test_loja` e contas MA5/MA6.
 */
export async function seedTestDatabase(): Promise<void> {
  const connectionString =
    process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/lojao';

  await runMigrations(connectionString);

  const pool = new Pool({ connectionString, ssl: false });

  try {
    const { merchantId, storeId } = await ensurePrimaryMerchantFixture(pool, connectionString);
    await seedPrimaryMerchantDb(TEST_PRIMARY_MERCHANT_SLUG, storeId);
    await ensureBillingFixtures(pool, merchantId);
    await ensureMerchantAccountFixtures(pool, connectionString);
    await pool.query('TRUNCATE login_attempts');

    process.env.TEST_PEDIDO_ID = String(TEST_PEDIDO_ID);
    process.env.TEST_PRODUTO_ID = String(TEST_PRODUTO_ID);
    process.env.TEST_PRODUTO_ESTOQUE_ID = String(TEST_PRODUTO_ESTOQUE_ID);

    const fixturePath = join(dirname(fileURLToPath(import.meta.url)), '.fixture-ids.json');
    writeFileSync(
      fixturePath,
      JSON.stringify({
        pedidoId: TEST_PEDIDO_ID,
        produtoId: TEST_PRODUTO_ID,
        produtoEstoqueId: TEST_PRODUTO_ESTOQUE_ID,
      }),
    );
  } finally {
    await pool.end();
  }
}

async function ensureMerchantRow(
  pool: pg.Pool,
  connectionString: string,
  slug: string,
  name: string,
  maxStores = 1,
): Promise<number> {
  const { dbName } = await ensureMerchantDatabase(slug);
  const base = parseConnectionUrl(connectionString);

  const res = await pool.query<{ id: number }>(
    `INSERT INTO merchants (slug, name, active, db_name, db_host, db_user, db_password, db_port, max_stores)
     VALUES ($1, $2, true, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (slug) DO UPDATE SET
       active = true,
       db_name = EXCLUDED.db_name,
       db_host = EXCLUDED.db_host,
       db_user = EXCLUDED.db_user,
       db_password = EXCLUDED.db_password,
       db_port = EXCLUDED.db_port,
       max_stores = GREATEST(merchants.max_stores, EXCLUDED.max_stores)
     RETURNING id`,
    [slug, name, dbName, base.host, base.user, base.password, base.port, maxStores],
  );
  return res.rows[0]!.id;
}

async function ensureOwnerMember(
  pool: pg.Pool,
  merchantId: number,
  email: string,
  name: string,
  senha: string,
  role: 'owner' | 'operator' = 'owner',
): Promise<void> {
  const passwordHash = await argon2.hash(senha, ARGON2_OPTIONS);
  await pool.query(
    `INSERT INTO merchant_members (merchant_id, email, name, password_hash, role, active, failed_attempts, blocked_until)
     VALUES ($1, $2, $3, $4, $5, true, 0, NULL)
     ON CONFLICT (merchant_id, email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash,
           name = EXCLUDED.name,
           role = EXCLUDED.role,
           active = true,
           failed_attempts = 0,
           blocked_until = NULL`,
    [merchantId, email, name, passwordHash, role],
  );
}

async function ensureStoreRow(
  pool: pg.Pool,
  merchantId: number,
  slug: string,
  name: string,
): Promise<number> {
  const existing = await pool.query<{ id: number }>('SELECT id FROM stores WHERE slug = $1', [slug]);
  if (existing.rows[0]) {
    await pool.query('UPDATE stores SET active = true, merchant_id = $1 WHERE id = $2', [
      merchantId,
      existing.rows[0].id,
    ]);
    return existing.rows[0].id;
  }

  const result = await createStoreForMerchant(merchantId, { slug, name });
  if (!result.ok) {
    throw new Error(`Falha ao criar loja ${slug}: ${result.code}`);
  }
  return result.store.id;
}

/** Merchant primário `test-loja` + loja `loja` + owner `admin@loja.com`. */
async function ensurePrimaryMerchantFixture(
  pool: pg.Pool,
  connectionString: string,
): Promise<{ merchantId: number; storeId: number }> {
  const existing = await pool.query<{ id: number }>(
    'SELECT id FROM merchants WHERE slug = $1',
    [TEST_PRIMARY_MERCHANT_SLUG],
  );

  let merchantId: number;
  if (existing.rows.length === 0) {
    const created = await createMerchant(
      { slug: TEST_PRIMARY_MERCHANT_SLUG, name: 'Test Loja Merchant' },
      { maxStores: 1 },
    );
    if (!created.ok) {
      throw new Error(`Falha ao criar merchant primário: ${created.code}`);
    }
    merchantId = created.merchant.id;
  } else {
    merchantId = existing.rows[0]!.id;
    await ensureMerchantDatabase(TEST_PRIMARY_MERCHANT_SLUG);
  }

  await ensureOwnerMember(
    pool,
    merchantId,
    TEST_ADMIN_EMAIL,
    'Administrador',
    TEST_ADMIN_SENHA,
    'owner',
  );

  const storeId = await ensureStoreRow(pool, merchantId, TEST_STORE_SLUG, 'Ata Commerce Demo');
  return { merchantId, storeId };
}

/** Fixtures EN no banco físico `atacommerce_<merchant_slug>`. */
async function seedPrimaryMerchantDb(merchantSlug: string, storeId: number): Promise<void> {
  const mPool = new Pool(merchantPoolConfig(merchantDbName(merchantSlug)));
  try {
    await ensureStoreSettings(mPool, storeId);
    const buyerId = await ensureBuyer(mPool, storeId);
    await ensureCheckoutFixtures(mPool, storeId);
    await ensureTestOrder(mPool, storeId, buyerId);
  } finally {
    await mPool.end();
  }
}

async function ensureStoreSettings(pool: pg.Pool, storeId: number): Promise<void> {
  await pool.query(
    `INSERT INTO store_settings (store_id, key, value) VALUES
       ($1, 'store.display_name', 'Ata Commerce Demo'),
       ($1, 'store.primary_color', $2),
       ($1, 'store.tagline', ''),
       ($1, 'inventory.enabled', 'true')
     ON CONFLICT (store_id, key) DO UPDATE SET value = EXCLUDED.value`,
    [storeId, DEFAULT_LOJA_COR_PRIMARIA],
  );
}

async function ensureBuyer(pool: pg.Pool, storeId: number): Promise<number> {
  const passwordHash = await argon2.hash(TEST_USER_SENHA, ARGON2_OPTIONS);
  const res = await pool.query<{ id: number }>(
    `INSERT INTO buyers (store_id, name, email, password_hash, active, failed_attempts, locked_until)
     VALUES ($1, 'Comprador Teste', $2, $3, true, 0, NULL)
     ON CONFLICT (store_id, email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash,
           active = true,
           failed_attempts = 0,
           locked_until = NULL
     RETURNING id`,
    [storeId, TEST_USER_EMAIL, passwordHash],
  );
  return res.rows[0]!.id;
}

async function ensureCheckoutFixtures(pool: pg.Pool, storeId: number): Promise<void> {
  const existingProd = await pool.query<{ id: number }>(
    "SELECT id FROM products WHERE store_id = $1 AND name = 'Produto Checkout Teste' LIMIT 1",
    [storeId],
  );
  if (existingProd.rows[0]) {
    TEST_PRODUTO_ID = existingProd.rows[0].id;
  } else {
    const prodRes = await pool.query<{ id: number }>(
      `INSERT INTO products (store_id, name, price, stock)
       VALUES ($1, 'Produto Checkout Teste', 29.90, 100) RETURNING id`,
      [storeId],
    );
    if (prodRes.rows[0]) TEST_PRODUTO_ID = prodRes.rows[0].id;
  }

  const existingEstoque = await pool.query<{ id: number }>(
    "SELECT id FROM products WHERE store_id = $1 AND name = 'Produto Estoque Limitado' LIMIT 1",
    [storeId],
  );
  if (existingEstoque.rows[0]) {
    TEST_PRODUTO_ESTOQUE_ID = existingEstoque.rows[0].id;
    await pool.query('UPDATE products SET stock = 1 WHERE id = $1', [existingEstoque.rows[0].id]);
  } else {
    const estoqueRes = await pool.query<{ id: number }>(
      `INSERT INTO products (store_id, name, price, stock)
       VALUES ($1, 'Produto Estoque Limitado', 10.00, 1) RETURNING id`,
      [storeId],
    );
    if (estoqueRes.rows[0]) TEST_PRODUTO_ESTOQUE_ID = estoqueRes.rows[0].id;
  }

  const botExists = await pool.query<{ id: number }>(
    `SELECT id FROM chat_bot_replies WHERE store_id = $1 AND keyword LIKE '%olá%' LIMIT 1`,
    [storeId],
  );
  if (!botExists.rows[0]) {
    await pool.query(
      `INSERT INTO chat_bot_replies (store_id, keyword, reply)
       VALUES ($1, 'olá, oi', 'Olá! Como posso ajudar?')`,
      [storeId],
    );
  }
}

async function ensureTestOrder(pool: pg.Pool, storeId: number, buyerId: number): Promise<void> {
  const existing = await pool.query<{ id: number }>(
    'SELECT id FROM orders WHERE store_id = $1 AND buyer_id = $2 ORDER BY id LIMIT 1',
    [storeId, buyerId],
  );
  if (existing.rows[0]) {
    TEST_PEDIDO_ID = existing.rows[0].id;
    return;
  }

  const pedidoRes = await pool.query<{ id: number }>(
    `INSERT INTO orders (
       store_id, buyer_id, status, subtotal, shipping_fee, total, payment_method,
       shipping_name, shipping_email, shipping_phone, shipping_cpf,
       shipping_postal_code, shipping_street, shipping_number, shipping_complement,
       shipping_district, shipping_city, shipping_state
     ) VALUES (
       $1, $2, 'paid', 50, 10, 60, 'pix',
       'Comprador Teste', $3, '11999999999', '12345678901',
       '01310100', 'Av Paulista', '1000', 'Apto 1', 'Bela Vista', 'São Paulo', 'SP'
     ) RETURNING id`,
    [storeId, buyerId, TEST_USER_EMAIL],
  );
  const pedidoId = pedidoRes.rows[0]?.id;
  if (!pedidoId) return;
  TEST_PEDIDO_ID = pedidoId;

  await pool.query(
    `INSERT INTO order_items (store_id, order_id, product_name, quantity, unit_price, subtotal)
     VALUES ($1, $2, 'Produto Teste', 2, 25, 50)`,
    [storeId, pedidoId],
  );

  await pool.query(
    `INSERT INTO payments (store_id, order_id, mp_payment_id, status, status_mp, method, amount)
     VALUES ($1, $2, 'mp-test-1', 'paid', 'approved', 'pix', 60)`,
    [storeId, pedidoId],
  );
}

/** Billing master — plano com comissão para merchant primário (MA7/MA8). */
async function ensureBillingFixtures(pool: pg.Pool, merchantId: number): Promise<void> {
  await pool.query(`
    INSERT INTO billing_plans (name, slug, billing_type, price, commission_percentage)
    VALUES ('Test Revenue', 'test-revenue', 'revenue_share', NULL, 5.00)
    ON CONFLICT (slug) DO NOTHING
  `);

  const planRes = await pool.query<{ id: string }>(
    `SELECT id FROM billing_plans WHERE slug = 'test-revenue'`,
  );
  const planId = planRes.rows[0]?.id;
  if (!planId) return;

  await pool.query(
    `INSERT INTO merchant_billing (merchant_id, plan_id, billing_type, commission_percentage, status)
     VALUES ($1, $2, 'revenue_share', 5.00, 'active')
     ON CONFLICT (merchant_id) DO UPDATE
       SET plan_id = $2, commission_percentage = 5.00, status = 'active'`,
    [merchantId, planId],
  );
}

/**
 * MA5/MA6 — merchants de teste com bancos físicos reais (`atacommerce_*`).
 */
async function ensureMerchantAccountFixtures(
  pool: pg.Pool,
  connectionString: string,
): Promise<void> {
  const ownerHash = await argon2.hash(TEST_MERCHANT_OWNER_SENHA, ARGON2_OPTIONS);
  const operatorHash = await argon2.hash(TEST_MERCHANT_PLAN_OPERATOR_SENHA, ARGON2_OPTIONS);

  const merchantId = await ensureMerchantRow(
    pool,
    connectionString,
    TEST_MERCHANT_SLUG,
    'Merchant MA5 Teste',
    1,
  );
  await pool.query(
    `INSERT INTO merchant_members (merchant_id, email, name, password_hash, role, active, failed_attempts, blocked_until)
     VALUES ($1, $2, 'Owner MA5', $3, 'owner', true, 0, NULL)
     ON CONFLICT (merchant_id, email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash, active = true, failed_attempts = 0, blocked_until = NULL`,
    [merchantId, TEST_MERCHANT_OWNER_EMAIL, ownerHash],
  );
  await ensureStoreRow(pool, merchantId, TEST_MERCHANT_STORE_SLUG, 'Loja MA5 Única');

  const merchantMultiId = await ensureMerchantRow(
    pool,
    connectionString,
    TEST_MERCHANT_MULTI_SLUG,
    'Merchant MA5 Multi-loja',
    2,
  );
  await pool.query(
    `INSERT INTO merchant_members (merchant_id, email, name, password_hash, role, active, failed_attempts, blocked_until)
     VALUES ($1, $2, 'Owner MA5 Multi', $3, 'owner', true, 0, NULL)
     ON CONFLICT (merchant_id, email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash, active = true, failed_attempts = 0, blocked_until = NULL`,
    [merchantMultiId, TEST_MERCHANT_MULTI_OWNER_EMAIL, ownerHash],
  );
  await ensureStoreRow(pool, merchantMultiId, TEST_MERCHANT_MULTI_STORE_A_SLUG, 'Loja MA5 Multi A');
  await ensureStoreRow(pool, merchantMultiId, TEST_MERCHANT_MULTI_STORE_B_SLUG, 'Loja MA5 Multi B');

  const merchantPlanId = await ensureMerchantRow(
    pool,
    connectionString,
    TEST_MERCHANT_PLAN_SLUG,
    'Merchant MA6 Plano Pro',
    TEST_MERCHANT_PLAN_MAX_STORES,
  );
  await pool.query(
    `INSERT INTO merchant_members (merchant_id, email, name, password_hash, role, active, failed_attempts, blocked_until)
     VALUES ($1, $2, 'Owner MA6 Plano', $3, 'owner', true, 0, NULL)
     ON CONFLICT (merchant_id, email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash, active = true, failed_attempts = 0, blocked_until = NULL`,
    [merchantPlanId, TEST_MERCHANT_PLAN_OWNER_EMAIL, ownerHash],
  );
  await pool.query(
    `INSERT INTO merchant_members (merchant_id, email, name, password_hash, role, active, failed_attempts, blocked_until)
     VALUES ($1, $2, 'Operator MA6 Plano', $3, 'operator', true, 0, NULL)
     ON CONFLICT (merchant_id, email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash, active = true, failed_attempts = 0, blocked_until = NULL`,
    [merchantPlanId, TEST_MERCHANT_PLAN_OPERATOR_EMAIL, operatorHash],
  );
  await ensureStoreRow(pool, merchantPlanId, TEST_MERCHANT_PLAN_STORE_SLUG, 'Loja MA6 Plano A');
}
