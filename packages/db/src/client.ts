import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

import * as masterSchema from './schema/master/index.js';
import * as tenantSchema from './schema/tenant/index.js';

const { Pool } = pg;

export type MasterDatabase = NodePgDatabase<typeof masterSchema>;
export type TenantDatabase = NodePgDatabase<typeof tenantSchema>;

const drizzleTenantCache = new Map<string, TenantDatabase>();

/** Instância Drizzle para o banco master (tenants, sessao, billing). */
export function createMasterDb(pool: pg.Pool): MasterDatabase {
  return drizzle(pool, { schema: masterSchema });
}

/**
 * Instância Drizzle para o banco de um tenant.
 * Opção A da spec: cache por slug, espelha `getPool(slug)` do legacy.
 */
export function createTenantDb(pool: pg.Pool): TenantDatabase {
  return drizzle(pool, { schema: tenantSchema });
}

export function getCachedTenantDb(slug: string, pool: pg.Pool): TenantDatabase {
  const cached = drizzleTenantCache.get(slug);
  if (cached) return cached;
  const db = createTenantDb(pool);
  drizzleTenantCache.set(slug, db);
  return db;
}

export function invalidateTenantDbCache(slug: string): void {
  drizzleTenantCache.delete(slug);
}

const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), '../drizzle');

const sslEnabled =
  (process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL) &&
  process.env.PGSSL !== 'disable';

function pgSsl(): boolean | { rejectUnauthorized: false } {
  return sslEnabled ? { rejectUnauthorized: false } : false;
}

/** Aplica migrations Drizzle (baseline + futuras). Idempotente com IF NOT EXISTS no baseline. */
export async function runMigrations(connectionString?: string): Promise<void> {
  const url = connectionString ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL não definida para db:migrate');
  }

  const pool = new Pool({ connectionString: url, ssl: pgSsl() });
  const db = drizzle(pool);

  try {
    await migrate(db, { migrationsFolder });
  } finally {
    await pool.end();
  }
}

export * from './schema/master/index.js';
export * from './schema/tenant/index.js';
