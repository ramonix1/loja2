import pg from 'pg';

import { masterPool } from './master-db.js';

const { Pool } = pg;

export interface TenantMeta {
  id: number;
  slug: string;
  nome: string;
}

const poolCache = new Map<string, pg.Pool>();
const metaCache = new Map<string, TenantMeta>();

/**
 * Resolve o pool e os metadados de um tenant pelo slug. Portado de
 * `apps/legacy/config/tenantDb.js` (`getPool`), mantendo o cache por slug.
 *
 * Lança erro se o tenant não existir ou estiver inativo — o plugin de tenant
 * traduz isso em `404 TENANT_NOT_FOUND`.
 */
export async function getTenant(slug: string): Promise<{ pool: pg.Pool; tenant: TenantMeta }> {
  const cachedPool = poolCache.get(slug);
  const cachedMeta = metaCache.get(slug);
  if (cachedPool && cachedMeta) {
    return { pool: cachedPool, tenant: cachedMeta };
  }

  const result = await masterPool.query(
    'SELECT * FROM tenants WHERE slug = $1 AND ativo = true',
    [slug],
  );
  const row = result.rows[0] as
    | {
        id: number;
        slug: string;
        nome: string;
        db_host: string;
        db_port: number | null;
        db_name: string;
        db_user: string;
        db_password: string;
      }
    | undefined;

  if (!row) {
    throw new Error(`Tenant não encontrado: ${slug}`);
  }

  const isProduction = process.env.NODE_ENV === 'production';

  // Em testes, master e tenant são o mesmo Postgres: conectamos o pool do
  // tenant via DATABASE_URL (o host varia entre Docker `db` e host `localhost`,
  // então não dependemos do `db_host` gravado na linha do tenant).
  const testOverrideUrl =
    process.env.NODE_ENV === 'test' ? process.env.DATABASE_URL : undefined;

  const pool = testOverrideUrl
    ? new Pool({ connectionString: testOverrideUrl, ssl: false })
    : new Pool({
        host: row.db_host,
        port: row.db_port ?? 5432,
        database: row.db_name,
        user: row.db_user,
        password: row.db_password,
        ssl: isProduction ? { rejectUnauthorized: false } : false,
      });

  const meta: TenantMeta = { id: row.id, slug: row.slug, nome: row.nome };
  poolCache.set(slug, pool);
  metaCache.set(slug, meta);

  return { pool, tenant: meta };
}

/** Compatível com o `getPool(slug)` do legacy. */
export async function getPool(slug: string): Promise<pg.Pool> {
  const { pool } = await getTenant(slug);
  return pool;
}

/** Invalida o cache de um tenant (encerra o pool). */
export async function invalidatePool(slug: string): Promise<void> {
  const pool = poolCache.get(slug);
  if (pool) {
    await pool.end();
    poolCache.delete(slug);
    metaCache.delete(slug);
  }
}
