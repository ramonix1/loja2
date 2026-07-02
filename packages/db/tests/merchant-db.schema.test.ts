import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { runMerchantMigrations } from '../src/client.js';
import {
  buyers,
  cartItems,
  categories,
  orderItems,
  orders,
  products,
} from '../src/schema/merchant/index.js';

/**
 * MA2 — schema do banco merchant (`atacommerce_<merchant_slug>`), fisicamente
 * separado do master. Testado num banco isolado próprio (não `lojao`), criado
 * e destruído aqui — nesta fase (MA2) ainda não existe provisionamento real
 * (isso é MA3); o objetivo é validar apenas o schema Drizzle + migration.
 */
const adminConnectionString =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/lojao';
const TEST_DB_NAME = 'atacommerce_ma2_schema_test';

function dbUrlFor(dbName: string): string {
  const url = new URL(adminConnectionString);
  url.pathname = `/${dbName}`;
  return url.toString();
}

describe('MA2 — schema merchant DB (store_id)', () => {
  const adminPool = new pg.Pool({ connectionString: adminConnectionString, ssl: false });
  const testDbUrl = dbUrlFor(TEST_DB_NAME);
  let pool: pg.Pool;
  let db: ReturnType<typeof drizzle>;

  beforeAll(async () => {
    await adminPool.query(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}"`);
    await adminPool.query(`CREATE DATABASE "${TEST_DB_NAME}"`);
    await runMerchantMigrations(testDbUrl);

    pool = new pg.Pool({ connectionString: testDbUrl, ssl: false });
    db = drizzle(pool);
  });

  afterAll(async () => {
    await pool.end();
    await adminPool.query(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}"`);
    await adminPool.end();
  });

  it('cria categoria + produto + comprador escopados por store_id', async () => {
    const [category] = await db
      .insert(categories)
      .values({ storeId: 1, name: 'Camisetas' })
      .returning();
    expect(category.active).toBe(true);

    const [product] = await db
      .insert(products)
      .values({ storeId: 1, name: 'Camiseta branca', price: '49.90', categoryId: category.id })
      .returning();
    expect(product.storeId).toBe(1);

    const [buyer] = await db
      .insert(buyers)
      .values({
        storeId: 1,
        name: 'Cliente Teste',
        email: 'cliente@ma2-schema-test.example',
        passwordHash: 'hash-fake',
      })
      .returning();
    expect(buyer.active).toBe(true);
    expect(buyer.failedAttempts).toBe(0);
  });

  it('permite o mesmo e-mail de comprador em stores diferentes, mas não na mesma store', async () => {
    const email = 'repetido@ma2-schema-test.example';
    await db.insert(buyers).values({
      storeId: 10,
      name: 'Fulano loja A',
      email,
      passwordHash: 'hash-fake',
    });

    await expect(
      db.insert(buyers).values({
        storeId: 10,
        name: 'Fulano duplicado loja A',
        email,
        passwordHash: 'hash-fake',
      }),
    ).rejects.toThrow();

    const [buyerLojaB] = await db
      .insert(buyers)
      .values({
        storeId: 11,
        name: 'Fulano loja B',
        email,
        passwordHash: 'hash-fake',
      })
      .returning();
    expect(buyerLojaB.storeId).toBe(11);
  });

  it('rejeita quantidade zero/negativa em cart_items (CHECK)', async () => {
    const [buyer] = await db
      .insert(buyers)
      .values({
        storeId: 20,
        name: 'Comprador carrinho',
        email: 'carrinho@ma2-schema-test.example',
        passwordHash: 'hash-fake',
      })
      .returning();
    const [product] = await db
      .insert(products)
      .values({ storeId: 20, name: 'Produto carrinho', price: '10.00' })
      .returning();

    await expect(
      db.insert(cartItems).values({
        storeId: 20,
        buyerId: buyer.id,
        productId: product.id,
        quantity: 0,
        unitPrice: '10.00',
      }),
    ).rejects.toThrow();
  });

  it('rejeita status fora do enum EN em orders (CHECK)', async () => {
    const [buyer] = await db
      .insert(buyers)
      .values({
        storeId: 30,
        name: 'Comprador pedido',
        email: 'pedido@ma2-schema-test.example',
        passwordHash: 'hash-fake',
      })
      .returning();

    await expect(
      db.insert(orders).values({
        storeId: 30,
        buyerId: buyer.id,
        shippingName: 'Comprador pedido',
        shippingEmail: 'pedido@ma2-schema-test.example',
        subtotal: '10.00',
        total: '10.00',
        status: 'aguardando_pagamento',
      }),
    ).rejects.toThrow();

    const [order] = await db
      .insert(orders)
      .values({
        storeId: 30,
        buyerId: buyer.id,
        shippingName: 'Comprador pedido',
        shippingEmail: 'pedido@ma2-schema-test.example',
        subtotal: '10.00',
        total: '10.00',
      })
      .returning();
    expect(order.status).toBe('awaiting_payment');
  });

  it('apaga produto e mantém order_items com product_id nulo (ON DELETE SET NULL)', async () => {
    const [buyer] = await db
      .insert(buyers)
      .values({
        storeId: 40,
        name: 'Comprador cascade',
        email: 'cascade@ma2-schema-test.example',
        passwordHash: 'hash-fake',
      })
      .returning();
    const [product] = await db
      .insert(products)
      .values({ storeId: 40, name: 'Produto a remover', price: '5.00' })
      .returning();
    const [order] = await db
      .insert(orders)
      .values({
        storeId: 40,
        buyerId: buyer.id,
        shippingName: 'Comprador cascade',
        shippingEmail: 'cascade@ma2-schema-test.example',
        subtotal: '5.00',
        total: '5.00',
      })
      .returning();

    await db.insert(orderItems).values({
      storeId: 40,
      orderId: order.id,
      productId: product.id,
      productName: 'Produto a remover',
      quantity: 1,
      unitPrice: '5.00',
      subtotal: '5.00',
    });

    await db.delete(products).where(eq(products.id, product.id));

    const [item] = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    expect(item.productId).toBeNull();
    expect(item.productName).toBe('Produto a remover');
  });
});
