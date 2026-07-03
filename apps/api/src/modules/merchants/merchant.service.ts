import { createMasterDb, eq, merchants, sql, stores } from '@lojao/db';
import type { CreateMerchantInput, CreateStoreInput, MerchantSummary, StoreSummary } from '@lojao/types/merchant';

import { masterPool } from '../../lib/master-db.js';
import { ensureMerchantDatabase } from '../../lib/merchant-provision.js';
import { baseConnectionFromEnv } from '../../lib/db-connection.js';

const masterDb = createMasterDb(masterPool);

type MerchantRow = typeof merchants.$inferSelect;
type StoreRow = typeof stores.$inferSelect;

function toMerchantSummary(row: MerchantRow): MerchantSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    active: row.active ?? true,
    maxStores: row.maxStores,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
  };
}

function toStoreSummary(row: StoreRow): StoreSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    active: row.active ?? true,
    merchantId: row.merchantId,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
  };
}

export type CreateMerchantResult =
  | { ok: true; merchant: MerchantSummary }
  | { ok: false; code: 'SLUG_EXISTS' };

/**
 * Cria um **merchant** (conta Ata Commerce) no master e provisiona seu banco
 * físico isolado (`atacommerce_<merchant_slug>`) com o schema `merchant`
 * (MA2, `store_id`) migrado.
 *
 * Substitui o database-per-store interim para contas novas na arquitetura MA
 * (spec §"Substituição de tenants"). **Não** cria a primeira `store` nem o
 * `merchant_member` owner — o fluxo completo de signup self-service
 * (merchant + store + owner) é o `merchant-signup.service.ts` (MA6), que
 * consome esta função como primitivo de provisionamento.
 *
 * `opts.maxStores` (MA6) define o limite de lojas do plano contratado
 * (`MERCHANT_PLAN_MAX_STORES`); default `1` (Starter) quando omitido — mesmo
 * comportamento do baseline MA1/MA3 (contas criadas sem plano explícito, ex.
 * em testes, continuam com 1 loja).
 */
export async function createMerchant(
  input: CreateMerchantInput,
  opts: { maxStores?: number } = {},
): Promise<CreateMerchantResult> {
  const existing = await masterDb
    .select({ id: merchants.id })
    .from(merchants)
    .where(eq(merchants.slug, input.slug));
  if (existing.length > 0) {
    return { ok: false, code: 'SLUG_EXISTS' };
  }

  const base = baseConnectionFromEnv();

  // Cria o banco físico + migrations ANTES de registrar o merchant, para não
  // deixar uma linha órfã apontando para um banco inexistente (mesmo padrão
  // de `createTenant` no database-per-store interim).
  const { dbName } = await ensureMerchantDatabase(input.slug);

  const [row] = await masterDb
    .insert(merchants)
    .values({
      slug: input.slug,
      name: input.name,
      dbName,
      dbHost: base.host,
      dbPort: base.port,
      dbUser: base.user,
      dbPassword: base.password,
      maxStores: opts.maxStores ?? 1,
    })
    .returning();

  return { ok: true, merchant: toMerchantSummary(row!) };
}

export async function getMerchantBySlug(slug: string): Promise<MerchantSummary | null> {
  const [row] = await masterDb.select().from(merchants).where(eq(merchants.slug, slug));
  return row ? toMerchantSummary(row) : null;
}

export type CreateStoreResult =
  | { ok: true; store: StoreSummary }
  | { ok: false; code: 'SLUG_EXISTS' | 'STORE_LIMIT_REACHED' | 'MERCHANT_NOT_FOUND' };

/**
 * MA6 — cria uma loja (`stores`) dentro de um merchant existente, aplicando o
 * enforcement de `max_stores` do plano (spec §2.4: `403 STORE_LIMIT_REACHED`
 * se `COUNT(stores) >= plan.max_stores`). Usada tanto pela loja #1 do signup
 * (`merchant-signup.service.ts`) quanto por `POST /merchants/:id/stores`
 * (loja #2, #3…).
 *
 * `slug` é único **globalmente** em `stores` (vitrine `/store/{slug}`) — spec
 * §2.5 "Vitrine".
 */
export async function createStoreForMerchant(
  merchantId: number,
  input: CreateStoreInput,
): Promise<CreateStoreResult> {
  const [merchant] = await masterDb
    .select({ id: merchants.id, maxStores: merchants.maxStores })
    .from(merchants)
    .where(eq(merchants.id, merchantId));
  if (!merchant) {
    return { ok: false, code: 'MERCHANT_NOT_FOUND' };
  }

  const [countRow] = await masterDb
    .select({ count: sql<number>`count(*)::int` })
    .from(stores)
    .where(eq(stores.merchantId, merchantId));
  const count = countRow?.count ?? 0;
  if (count >= merchant.maxStores) {
    return { ok: false, code: 'STORE_LIMIT_REACHED' };
  }

  const existingSlug = await masterDb
    .select({ id: stores.id })
    .from(stores)
    .where(eq(stores.slug, input.slug));
  if (existingSlug.length > 0) {
    return { ok: false, code: 'SLUG_EXISTS' };
  }

  const [row] = await masterDb
    .insert(stores)
    .values({ merchantId, slug: input.slug, name: input.name })
    .returning();

  return { ok: true, store: toStoreSummary(row!) };
}
