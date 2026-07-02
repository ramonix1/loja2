import { createMasterDb, and, eq, merchants, merchantMembers, sql, stores } from '@lojao/db';
import type { PlatformStore } from '@lojao/types/platform';
import { MERCHANT_PLAN_MAX_STORES } from '@lojao/types/merchant';

import { masterPool } from '../../lib/master-db.js';
import { createMerchant, createStoreForMerchant } from '../merchants/merchant.service.js';

const masterDb = createMasterDb(masterPool);

function planToMaxStores(plano?: string): number {
  if (plano === 'professional') return MERCHANT_PLAN_MAX_STORES.professional;
  if (plano === 'enterprise') return MERCHANT_PLAN_MAX_STORES.enterprise;
  return MERCHANT_PLAN_MAX_STORES.starter;
}

function maxStoresToPlano(maxStores: number): string | null {
  if (maxStores >= MERCHANT_PLAN_MAX_STORES.enterprise) return 'enterprise';
  if (maxStores >= MERCHANT_PLAN_MAX_STORES.professional) return 'professional';
  return 'starter';
}

function toPlatformStore(row: {
  id: number;
  slug: string;
  name: string;
  active: boolean | null;
  createdAt: Date | null;
  merchantActive: boolean | null;
  maxStores: number;
}): PlatformStore {
  return {
    id: row.id,
    slug: row.slug,
    nome: row.name,
    plano: maxStoresToPlano(row.maxStores),
    ativo: (row.active ?? true) && (row.merchantActive ?? true),
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
  };
}

/** Lista lojas (`stores`) para o Platform Hub. */
export async function listPlatformStores(): Promise<PlatformStore[]> {
  const rows = await masterDb
    .select({
      id: stores.id,
      slug: stores.slug,
      name: stores.name,
      active: stores.active,
      createdAt: stores.createdAt,
      merchantActive: merchants.active,
      maxStores: merchants.maxStores,
    })
    .from(stores)
    .innerJoin(merchants, eq(stores.merchantId, merchants.id))
    .orderBy(sql`${stores.createdAt} DESC NULLS LAST`, sql`${stores.id} DESC`);

  return rows.map(toPlatformStore);
}

export async function getPlatformStoreBySlug(slug: string): Promise<PlatformStore | null> {
  const [row] = await masterDb
    .select({
      id: stores.id,
      slug: stores.slug,
      name: stores.name,
      active: stores.active,
      createdAt: stores.createdAt,
      merchantActive: merchants.active,
      maxStores: merchants.maxStores,
    })
    .from(stores)
    .innerJoin(merchants, eq(stores.merchantId, merchants.id))
    .where(eq(stores.slug, slug))
    .limit(1);

  return row ? toPlatformStore(row) : null;
}

export type CreatePlatformStoreResult =
  | { ok: true; store: PlatformStore }
  | { ok: false; code: 'SLUG_EXISTS' };

/** Provisiona conta merchant + loja #1 para o Platform Hub. */
export async function createPlatformStore(input: {
  slug: string;
  nome: string;
  plano?: string;
}): Promise<CreatePlatformStoreResult> {
  const merchantResult = await createMerchant(
    { slug: input.slug, name: input.nome },
    { maxStores: planToMaxStores(input.plano) },
  );
  if (!merchantResult.ok) {
    return { ok: false, code: 'SLUG_EXISTS' };
  }

  const storeResult = await createStoreForMerchant(merchantResult.merchant.id, {
    slug: input.slug,
    name: input.nome,
  });
  if (!storeResult.ok) {
    return { ok: false, code: 'SLUG_EXISTS' };
  }

  return {
    ok: true,
    store: toPlatformStore({
      id: storeResult.store.id,
      slug: storeResult.store.slug,
      name: storeResult.store.name,
      active: storeResult.store.active,
      createdAt: storeResult.store.createdAt ? new Date(storeResult.store.createdAt) : null,
      merchantActive: merchantResult.merchant.active,
      maxStores: merchantResult.merchant.maxStores,
    }),
  };
}

export type UpdatePlatformStoreResult =
  | { ok: true; store: PlatformStore }
  | { ok: false; code: 'NOT_FOUND' };

/** Atualização soft: renomear loja, suspender/reativar, trocar plano (via `max_stores`). */
export async function updatePlatformStore(
  slug: string,
  patch: { nome?: string; ativo?: boolean; plano?: string },
): Promise<UpdatePlatformStoreResult> {
  const [storeRow] = await masterDb.select().from(stores).where(eq(stores.slug, slug)).limit(1);
  if (!storeRow) return { ok: false, code: 'NOT_FOUND' };

  if (patch.nome !== undefined) {
    await masterDb.update(stores).set({ name: patch.nome }).where(eq(stores.id, storeRow.id));
  }
  if (patch.ativo !== undefined) {
    await masterDb.update(stores).set({ active: patch.ativo }).where(eq(stores.id, storeRow.id));
  }
  if (patch.plano !== undefined) {
    await masterDb
      .update(merchants)
      .set({ maxStores: planToMaxStores(patch.plano) })
      .where(eq(merchants.id, storeRow.merchantId));
  }

  const updated = await getPlatformStoreBySlug(slug);
  return updated ? { ok: true, store: updated } : { ok: false, code: 'NOT_FOUND' };
}

export type StoreOwnerMember = {
  memberId: number;
  memberName: string;
  memberEmail: string;
  memberRole: string;
  merchantId: number;
  merchantSlug: string;
  storeId: number;
  storeSlug: string;
  storeName: string;
};

/** Owner da loja para impersonate de suporte (Platform Hub). */
export async function findStoreOwnerMember(storeSlug: string): Promise<StoreOwnerMember | null> {
  const [row] = await masterDb
    .select({
      memberId: merchantMembers.id,
      memberName: merchantMembers.name,
      memberEmail: merchantMembers.email,
      memberRole: merchantMembers.role,
      merchantId: merchants.id,
      merchantSlug: merchants.slug,
      storeId: stores.id,
      storeSlug: stores.slug,
      storeName: stores.name,
    })
    .from(stores)
    .innerJoin(merchants, eq(stores.merchantId, merchants.id))
    .innerJoin(
      merchantMembers,
      and(eq(merchantMembers.merchantId, merchants.id), eq(merchantMembers.role, 'owner')),
    )
    .where(eq(stores.slug, storeSlug))
    .limit(1);

  return row ?? null;
}
