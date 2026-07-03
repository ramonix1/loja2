import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { masterPool } from '../../src/lib/master-db.js';
import { merchantConnectionUrl, merchantDbName } from '../../src/lib/merchant-provision.js';
import { createMerchant, getMerchantBySlug } from '../../src/modules/merchants/merchant.service.js';

/**
 * MA3 — prova o provisionamento real do banco físico de um merchant
 * (`atacommerce_<merchant_slug>`) com o schema `merchant` (MA2) migrado.
 *
 * Diferente do resto da suíte (que roda em `TENANT_DB_STRATEGY=shared`), o
 * provisionamento de merchant sempre cria um banco físico — cria/derruba o
 * banco de teste aqui, mesmo padrão de `tenant.isolation.test.ts`.
 */
const SLUG = 'ma3-provision-test';

async function dropMerchant(slug: string): Promise<void> {
  await masterPool.query('DELETE FROM merchants WHERE slug = $1', [slug]);
  const dbName = merchantDbName(slug);
  await masterPool.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
}

describe('MA3 — provisionamento merchant DB (atacommerce_<merchant_slug>)', () => {
  beforeAll(async () => {
    await dropMerchant(SLUG);
  });

  afterAll(async () => {
    await dropMerchant(SLUG);
  });

  it('cria o banco físico atacommerce_<slug>, migra o schema merchant e registra no master', async () => {
    const result = await createMerchant({ slug: SLUG, name: 'Merchant Provisionamento Teste' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.merchant.slug).toBe(SLUG);
    expect(result.merchant.active).toBe(true);

    const expectedDbName = merchantDbName(SLUG);
    expect(expectedDbName).toBe(`atacommerce_${SLUG.replace(/-/g, '_')}`);

    const existsRes = await masterPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      expectedDbName,
    ]);
    expect(existsRes.rows).toHaveLength(1);

    const masterRow = await masterPool.query<{ db_name: string; db_host: string }>(
      'SELECT db_name, db_host FROM merchants WHERE slug = $1',
      [SLUG],
    );
    expect(masterRow.rows[0]?.db_name).toBe(expectedDbName);

    const merchantPool = new pg.Pool({
      connectionString: merchantConnectionUrl(expectedDbName),
      ssl: false,
    });
    try {
      const tableCheck = await merchantPool.query<{ reg: string | null }>(
        "SELECT to_regclass('public.products')::text AS reg",
      );
      expect(tableCheck.rows[0]?.reg).toBe('products');
    } finally {
      await merchantPool.end();
    }
  });

  it('rejeita slug duplicado (SLUG_EXISTS)', async () => {
    const result = await createMerchant({ slug: SLUG, name: 'Duplicado' });
    expect(result).toEqual({ ok: false, code: 'SLUG_EXISTS' });
  });

  it('getMerchantBySlug retorna o merchant provisionado', async () => {
    const merchant = await getMerchantBySlug(SLUG);
    expect(merchant?.slug).toBe(SLUG);
    expect(merchant?.name).toBe('Merchant Provisionamento Teste');
  });

  it('getMerchantBySlug retorna null para slug inexistente', async () => {
    const merchant = await getMerchantBySlug('ma3-slug-inexistente');
    expect(merchant).toBeNull();
  });
});
