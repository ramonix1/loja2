import { describe, expect, it } from 'vitest';
import pg from 'pg';

import { runMigrations } from '../src/client.js';

/** Tabelas master após MA8 (0005 dropa legado tenant/PT do master). */
const MASTER_TABLES_MA8 = [
  'sessao',
  'billing_plans',
  'platform_config',
  'leads',
  'merchants',
  'stores',
  'merchant_members',
  'login_attempts',
  'merchant_billing',
  'merchant_invoices',
  'merchant_commission_transactions',
];

/** Tabelas legado removidas pelo cutover MA8 (0005_ma8_drop_legacy.sql). */
const DROPPED_LEGACY_TABLES = [
  'tenants',
  'tenant_billing',
  'usuarios',
  'produtos',
  'pedidos',
  'configuracoes',
];

async function tableExists(pool: pg.Pool, name: string): Promise<boolean> {
  const res = await pool.query(`SELECT to_regclass($1) AS reg`, [`public.${name}`]);
  return res.rows[0]?.reg != null;
}

describe('db:migrate baseline', () => {
  it('aplica migrations MA8 e garante master greenfield (sem tabelas PT legado)', async () => {
    const connectionString =
      process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/lojao';

    await runMigrations(connectionString);

    const pool = new pg.Pool({ connectionString, ssl: false });
    try {
      for (const table of MASTER_TABLES_MA8) {
        expect(await tableExists(pool, table), `tabela ${table}`).toBe(true);
      }

      for (const table of DROPPED_LEGACY_TABLES) {
        expect(await tableExists(pool, table), `legado ${table} deve estar ausente`).toBe(false);
      }

      const journal = await pool.query(
        `SELECT COUNT(*)::int AS c FROM drizzle.__drizzle_migrations`,
      );
      expect(journal.rows[0]?.c).toBeGreaterThanOrEqual(6);
    } finally {
      await pool.end();
    }
  });
});
