import pg from 'pg';

import { getCachedMerchantDb, invalidateMerchantDbCache, type MerchantDatabase } from '@lojao/db';

import { masterPool } from './master-db.js';
import { merchantPoolConfig } from './merchant-provision.js';

const { Pool } = pg;

/**
 * MA4 — resolve a loja (`stores`) e o merchant (`merchants`) donos ativos no
 * master, e o pool/Drizzle do banco físico do merchant (`atacommerce_<slug>`).
 *
 * Espelha `tenant-db.ts` (`getTenant`), mas a chave de negócio é a **store**
 * (não o merchant): duas stores do mesmo merchant compartilham o mesmo pool
 * físico (cacheado por `merchant.slug`), diferenciadas por `store_id` nas
 * queries — quem consome `merchantDb` é responsável por filtrar `store_id`.
 */

export interface MerchantMeta {
  id: number;
  slug: string;
  name: string;
}

export interface StoreMeta {
  id: number;
  slug: string;
  name: string;
  merchantId: number;
}

export interface StoreContext {
  merchant: MerchantMeta;
  store: StoreMeta;
  pool: pg.Pool;
  merchantDb: MerchantDatabase;
}

/** Loja/merchant não encontrados ou inativos — o plugin `store` traduz para `404 STORE_NOT_FOUND`. */
export class StoreNotFoundError extends Error {}

const poolCache = new Map<string, pg.Pool>(); // key: merchant slug (banco físico é por merchant, não por store)
const metaCache = new Map<string, MerchantMeta>();

/** Limite de conexões por pool de merchant (mesmo racional de `TENANT_POOL_MAX`). */
function merchantPoolMax(): number {
  const raw = Number.parseInt(process.env.MERCHANT_POOL_MAX ?? '', 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 5;
}

interface StoreJoinRow {
  store_id: number;
  store_slug: string;
  store_name: string;
  store_active: boolean | null;
  merchant_id: number;
  merchant_slug: string;
  merchant_name: string;
  merchant_active: boolean | null;
  db_name: string;
}

async function queryStoreJoin(
  column: 'slug' | 'id',
  value: string | number,
): Promise<StoreJoinRow | undefined> {
  // `column` é literal fixo (nunca vem do request), seguro concatenar no SQL.
  const result = await masterPool.query<StoreJoinRow>(
    `SELECT s.id AS store_id, s.slug AS store_slug, s.name AS store_name, s.active AS store_active,
            m.id AS merchant_id, m.slug AS merchant_slug, m.name AS merchant_name, m.active AS merchant_active,
            m.db_name
     FROM stores s
     JOIN merchants m ON m.id = s.merchant_id
     WHERE s.${column} = $1`,
    [value],
  );
  return result.rows[0];
}

function getOrCreateMerchantPool(row: StoreJoinRow): pg.Pool {
  const cached = poolCache.get(row.merchant_slug);
  if (cached) return cached;

  const pool = new Pool({ ...merchantPoolConfig(row.db_name), max: merchantPoolMax() });
  poolCache.set(row.merchant_slug, pool);
  metaCache.set(row.merchant_slug, {
    id: row.merchant_id,
    slug: row.merchant_slug,
    name: row.merchant_name,
  });
  return pool;
}

function toContext(row: StoreJoinRow): StoreContext {
  const pool = getOrCreateMerchantPool(row);
  const merchant: MerchantMeta = {
    id: row.merchant_id,
    slug: row.merchant_slug,
    name: row.merchant_name,
  };
  const store: StoreMeta = {
    id: row.store_id,
    slug: row.store_slug,
    name: row.store_name,
    merchantId: row.merchant_id,
  };
  const merchantDb = getCachedMerchantDb(row.merchant_slug, pool);
  return { merchant, store, pool, merchantDb };
}

function assertActive(row: StoreJoinRow | undefined, identifier: string | number): StoreJoinRow {
  if (!row || !row.store_active || !row.merchant_active) {
    throw new StoreNotFoundError(`Loja não encontrada ou inativa: ${identifier}`);
  }
  return row;
}

/**
 * Resolve a loja ativa pelo slug (vitrine `/store/{storeSlug}`).
 * Lança `StoreNotFoundError` se a loja não existir ou a loja/merchant estiverem inativos.
 */
export async function getStoreBySlug(slug: string): Promise<StoreContext> {
  const row = assertActive(await queryStoreJoin('slug', slug), slug);
  return toContext(row);
}

/**
 * Resolve a loja ativa pelo id (sessão do admin — `session.storeId`).
 * Lança `StoreNotFoundError` se a loja não existir ou a loja/merchant estiverem inativos.
 */
export async function getStoreById(id: number): Promise<StoreContext> {
  const row = assertActive(await queryStoreJoin('id', id), id);
  return toContext(row);
}

/** Invalida o pool físico de um merchant (encerra conexões e limpa cache Drizzle). */
export async function invalidateMerchantPool(merchantSlug: string): Promise<void> {
  invalidateMerchantDbCache(merchantSlug);
  metaCache.delete(merchantSlug);
  const pool = poolCache.get(merchantSlug);
  if (pool) {
    await pool.end();
    poolCache.delete(merchantSlug);
  }
}
