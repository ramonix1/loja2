import { describe, expect, it } from 'vitest';
import pg from 'pg';

import { runMigrations } from '../src/client.js';

const MASTER_TABLES = [
  'tenants',
  'sessao',
  'billing_plans',
  'tenant_billing',
  'invoices',
  'commission_transactions',
  'platform_config',
  'leads',
  'webhook_events',
];

const TENANT_TABLES = [
  'usuarios',
  'tentativas_login',
  'tokens_recuperacao',
  'categorias',
  'produtos',
  'produtos_imagens',
  'configuracoes',
  'banners',
  'carrinho_itens',
  'pedidos',
  'pedido_itens',
  'pagamentos',
  'clientes',
  'auditoria',
  'movimentacoes_estoque',
  'agenda_config',
  'agenda_dias_especiais',
  'agendamentos',
  'conversas',
  'mensagens',
  'bot_respostas',
];

async function tableExists(pool: pg.Pool, name: string): Promise<boolean> {
  const res = await pool.query(`SELECT to_regclass($1) AS reg`, [`public.${name}`]);
  return res.rows[0]?.reg != null;
}

const EXPECTED_MIGRATION_COUNT = 31;

describe('db:migrate', () => {
  it('aplica migrations granulares e garante tabelas master + tenant', async () => {
    const connectionString =
      process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/lojao';

    await runMigrations(connectionString);

    const pool = new pg.Pool({ connectionString, ssl: false });
    try {
      for (const table of [...MASTER_TABLES, ...TENANT_TABLES]) {
        expect(await tableExists(pool, table), `tabela ${table}`).toBe(true);
      }

      const journal = await pool.query(
        `SELECT COUNT(*)::int AS c FROM drizzle.__drizzle_migrations`,
      );
      expect(journal.rows[0]?.c).toBeGreaterThanOrEqual(EXPECTED_MIGRATION_COUNT);
    } finally {
      await pool.end();
    }
  });
});
