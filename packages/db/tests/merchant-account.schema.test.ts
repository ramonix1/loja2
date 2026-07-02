import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { runMigrations } from '../src/client.js';
import { merchantMembers, merchants, stores } from '../src/schema/master/merchant-account.js';

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/lojao';

describe('MA1 — schema master merchant-account', () => {
  const pool = new pg.Pool({ connectionString, ssl: false });
  const db = drizzle(pool);

  beforeAll(async () => {
    await runMigrations(connectionString);
    // Isola os testes de dados de outras suítes que também usam merchants/stores.
    await pool.query("DELETE FROM merchant_members WHERE email LIKE '%@ma1-schema-test.example'");
    await pool.query("DELETE FROM stores WHERE slug LIKE 'ma1-schema-test-%'");
    await pool.query("DELETE FROM merchants WHERE slug LIKE 'ma1-schema-test-%'");
  });

  afterAll(async () => {
    await pool.query("DELETE FROM merchant_members WHERE email LIKE '%@ma1-schema-test.example'");
    await pool.query("DELETE FROM stores WHERE slug LIKE 'ma1-schema-test-%'");
    await pool.query("DELETE FROM merchants WHERE slug LIKE 'ma1-schema-test-%'");
    await pool.end();
  });

  it('cria merchant + duas stores + member owner', async () => {
    const [merchant] = await db
      .insert(merchants)
      .values({
        slug: 'ma1-schema-test-acme',
        name: 'Acme (teste MA1)',
        dbName: 'atacommerce_ma1_schema_test_acme',
        dbHost: 'localhost',
        dbUser: 'postgres',
        dbPassword: 'postgres',
      })
      .returning();

    expect(merchant.active).toBe(true);
    expect(merchant.dbPort).toBe(5432);

    const createdStores = await db
      .insert(stores)
      .values([
        { merchantId: merchant.id, slug: 'ma1-schema-test-loja-a', name: 'Loja A' },
        { merchantId: merchant.id, slug: 'ma1-schema-test-loja-b', name: 'Loja B' },
      ])
      .returning();
    expect(createdStores).toHaveLength(2);

    const [member] = await db
      .insert(merchantMembers)
      .values({
        merchantId: merchant.id,
        email: 'owner@ma1-schema-test.example',
        name: 'Dono da conta',
        passwordHash: 'hash-fake',
      })
      .returning();
    expect(member.role).toBe('owner');
    expect(member.active).toBe(true);
  });

  it('rejeita slug de store duplicado globalmente', async () => {
    const [merchant] = await db
      .insert(merchants)
      .values({
        slug: 'ma1-schema-test-dup-slug',
        name: 'Dup slug (teste MA1)',
        dbName: 'atacommerce_ma1_schema_test_dup_slug',
        dbHost: 'localhost',
        dbUser: 'postgres',
        dbPassword: 'postgres',
      })
      .returning();

    await db.insert(stores).values({
      merchantId: merchant.id,
      slug: 'ma1-schema-test-slug-unico',
      name: 'Primeira',
    });

    await expect(
      db.insert(stores).values({
        merchantId: merchant.id,
        slug: 'ma1-schema-test-slug-unico',
        name: 'Segunda',
      }),
    ).rejects.toThrow();
  });

  it('rejeita e-mail duplicado no mesmo merchant, mas permite em merchants diferentes', async () => {
    const [merchantA] = await db
      .insert(merchants)
      .values({
        slug: 'ma1-schema-test-member-a',
        name: 'Member A (teste MA1)',
        dbName: 'atacommerce_ma1_schema_test_member_a',
        dbHost: 'localhost',
        dbUser: 'postgres',
        dbPassword: 'postgres',
      })
      .returning();
    const [merchantB] = await db
      .insert(merchants)
      .values({
        slug: 'ma1-schema-test-member-b',
        name: 'Member B (teste MA1)',
        dbName: 'atacommerce_ma1_schema_test_member_b',
        dbHost: 'localhost',
        dbUser: 'postgres',
        dbPassword: 'postgres',
      })
      .returning();

    const sameEmail = 'repetido@ma1-schema-test.example';
    await db.insert(merchantMembers).values({
      merchantId: merchantA.id,
      email: sameEmail,
      name: 'Fulano',
      passwordHash: 'hash-fake',
    });

    await expect(
      db.insert(merchantMembers).values({
        merchantId: merchantA.id,
        email: sameEmail,
        name: 'Fulano duplicado',
        passwordHash: 'hash-fake',
      }),
    ).rejects.toThrow();

    // Mesmo e-mail em conta (merchant) diferente é permitido — contas são independentes.
    const [memberB] = await db
      .insert(merchantMembers)
      .values({
        merchantId: merchantB.id,
        email: sameEmail,
        name: 'Fulano em outra conta',
        passwordHash: 'hash-fake',
      })
      .returning();
    expect(memberB.merchantId).toBe(merchantB.id);
  });

  it('apaga stores e members em cascata ao remover o merchant', async () => {
    const [merchant] = await db
      .insert(merchants)
      .values({
        slug: 'ma1-schema-test-cascade',
        name: 'Cascade (teste MA1)',
        dbName: 'atacommerce_ma1_schema_test_cascade',
        dbHost: 'localhost',
        dbUser: 'postgres',
        dbPassword: 'postgres',
      })
      .returning();

    await db.insert(stores).values({
      merchantId: merchant.id,
      slug: 'ma1-schema-test-cascade-loja',
      name: 'Loja cascade',
    });
    await db.insert(merchantMembers).values({
      merchantId: merchant.id,
      email: 'cascade@ma1-schema-test.example',
      name: 'Membro cascade',
      passwordHash: 'hash-fake',
    });

    await db.delete(merchants).where(eq(merchants.id, merchant.id));

    const remainingStores = await db
      .select()
      .from(stores)
      .where(eq(stores.merchantId, merchant.id));
    const remainingMembers = await db
      .select()
      .from(merchantMembers)
      .where(eq(merchantMembers.merchantId, merchant.id));

    expect(remainingStores).toHaveLength(0);
    expect(remainingMembers).toHaveLength(0);
  });
});
