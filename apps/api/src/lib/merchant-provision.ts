import type pg from 'pg';

import { runMerchantMigrations } from '@lojao/db';

import { baseConnectionFromEnv } from './db-connection.js';
import { masterPool } from './master-db.js';

/**
 * MA3 — provisionamento do banco físico de um **merchant** (conta Ata Commerce):
 * `atacommerce_<merchant_slug>`, com o schema `merchant` (MA2, `store_id`)
 * migrado.
 *
 * Prefixo fixo `atacommerce_` por decisão da naming-policy — não deriva do
 * nome do banco da plataforma (`DATABASE_URL`).
 */

/**
 * Nome do banco físico de um merchant: `atacommerce_<slug>` saneado para um
 * identificador PostgreSQL válido (minúsculo, `[a-z0-9_]`, ≤ 63 bytes).
 */
export function merchantDbName(slug: string): string {
  const safeSlug = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const name = `atacommerce_${safeSlug}`;
  return name.slice(0, 63);
}

/** Monta a connection string de um banco de merchant a partir da base da env. */
export function merchantConnectionUrl(dbName: string): string {
  const dbUrl =
    process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/atacommerce';
  const url = new URL(dbUrl);
  url.pathname = `/${dbName}`;
  return url.toString();
}

function pgSsl(): boolean | { rejectUnauthorized: false } {
  const sslEnabled =
    (process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL) &&
    process.env.PGSSL !== 'disable';
  return sslEnabled ? { rejectUnauthorized: false } : false;
}

/** Config `pg.PoolConfig` de conexão para um banco de merchant específico. */
export function merchantPoolConfig(dbName: string): pg.PoolConfig {
  const base = baseConnectionFromEnv();
  return {
    host: base.host,
    port: base.port,
    user: base.user,
    password: base.password,
    database: dbName,
    ssl: pgSsl(),
  };
}

/** `true` se o banco físico já existir no servidor. */
async function databaseExists(dbName: string): Promise<boolean> {
  const res = await masterPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  return res.rows.length > 0;
}

/**
 * Garante que o banco físico do merchant exista e esteja migrado (idempotente).
 *
 * 1. `CREATE DATABASE` se ainda não existir (autocommit; requer permissão de
 *    criar bancos no Postgres — igual ao database-per-store interim).
 * 2. Roda as migrations Drizzle do schema `merchant` (MA2) no banco criado.
 *
 * Retorna o nome do banco e a connection string.
 */
export async function ensureMerchantDatabase(
  slug: string,
): Promise<{ dbName: string; url: string }> {
  const dbName = merchantDbName(slug);
  const url = merchantConnectionUrl(dbName);

  if (!(await databaseExists(dbName))) {
    // Identificador não pode ser parametrizado; dbName já foi saneado acima.
    await masterPool.query(`CREATE DATABASE "${dbName}"`);
  }

  await runMerchantMigrations(url);
  return { dbName, url };
}

/** Aplica migrations merchant em todos os bancos `atacommerce_*` registrados no master. */
export async function migrateAllMerchantDatabases(): Promise<void> {
  const res = await masterPool.query<{ slug: string }>(
    'SELECT slug FROM merchants ORDER BY slug',
  );

  if (res.rows.length === 0) {
    console.log('[merchant] Nenhum merchant registrado — pulando migrations merchant.');
    return;
  }

  for (const row of res.rows) {
    const slug = row.slug;
    const dbName = merchantDbName(slug);
    if (!(await databaseExists(dbName))) {
      console.warn(`[merchant] Banco ${dbName} ausente — pulando ${slug}.`);
      continue;
    }
    console.log(`[merchant] Aplicando migrations em ${dbName}...`);
    await runMerchantMigrations(merchantConnectionUrl(dbName));
  }
}
