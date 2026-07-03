import { createMasterDb, and, eq, ilike, merchantBilling, merchants, merchantMembers, or, sql, stores } from '@lojao/db';
import type {
  PlatformDashboardStats,
  PlatformHealthItem,
  PlatformHealthSummary,
  PlatformMerchantListItem,
  PlatformReportsSummary,
  PlatformStore,
  PlatformStoreBilling,
  PlatformStoreDetail,
  PlatformStoreHealth,
  PlatformStoreListItem,
  PlatformStoreMetrics,
} from '@lojao/types/platform';
import { MERCHANT_PLAN_MAX_STORES } from '@lojao/types/merchant';

import { masterPool } from '../../lib/master-db.js';
import {
  getMerchantBilling,
  getMerchantRevenueReport,
  listMerchantInvoices,
} from '../../services/merchant-billing.service.js';
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
    ativo: isStoreActive(row.active, row.merchantActive),
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
  };
}

function isStoreActive(storeActive: boolean | null, merchantActive: boolean | null): boolean {
  return (storeActive ?? true) && (merchantActive ?? true);
}

type StoreHealthContext = {
  ativo: boolean;
  billingStatus?: string | null;
  trialEndsAt?: Date | null;
};

/** Deriva saúde operacional da loja (P4). */
export function computeStoreHealth(ctx: StoreHealthContext): {
  health: PlatformStoreHealth;
  reasons: string[];
} {
  if (!ctx.ativo) {
    return { health: 'suspended', reasons: ['Loja ou merchant suspensa'] };
  }

  const reasons: string[] = [];
  let health: PlatformStoreHealth = 'healthy';

  if (!ctx.billingStatus) {
    reasons.push('Sem registro de billing');
    health = 'attention';
  } else {
    const status = ctx.billingStatus.toLowerCase();
    if (status === 'trialing' && ctx.trialEndsAt) {
      const daysLeft = Math.ceil((ctx.trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      if (daysLeft < 0) {
        reasons.push('Trial expirado');
        health = 'attention';
      } else if (daysLeft <= 7) {
        reasons.push(`Trial expira em ${daysLeft} dia(s)`);
        health = 'attention';
      }
    } else if (status === 'past_due' || status === 'cancelled' || status === 'unpaid') {
      reasons.push(`Billing: ${ctx.billingStatus}`);
      health = 'attention';
    }
  }

  return { health, reasons };
}

function toStoreHealth(ctx: StoreHealthContext): PlatformStoreHealth {
  return computeStoreHealth(ctx).health;
}

function toPlatformStoreListItem(row: {
  id: number;
  slug: string;
  name: string;
  active: boolean | null;
  createdAt: Date | null;
  merchantActive: boolean | null;
  maxStores: number;
  merchantName: string;
  merchantSlug: string;
  billingStatus?: string | null;
  trialEndsAt?: Date | null;
}): PlatformStoreListItem {
  const base = toPlatformStore(row);
  return {
    ...base,
    merchantName: row.merchantName,
    merchantSlug: row.merchantSlug,
    health: toStoreHealth({
      ativo: base.ativo,
      billingStatus: row.billingStatus,
      trialEndsAt: row.trialEndsAt,
    }),
  };
}

/** Lista lojas (`stores`) para o Platform Hub. */
export async function listPlatformStores(): Promise<PlatformStore[]> {
  const result = await listPlatformStoresQuery({});
  return result.items.map(({ merchantName: _m, merchantSlug: _s, health: _h, ...store }) => store);
}

export type ListPlatformStoresQuery = {
  q?: string;
  status?: 'active' | 'suspended';
  plano?: string;
  page?: number;
  limit?: number;
};

export type ListPlatformStoresResult = {
  items: PlatformStoreListItem[];
  total: number;
  page: number;
  limit: number;
};

/** Lista paginada com busca/filtros para o Platform Hub. */
export async function listPlatformStoresQuery(
  query: ListPlatformStoresQuery,
): Promise<ListPlatformStoresResult> {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 20));
  const offset = (page - 1) * limit;

  const conditions = [];

  if (query.q?.trim()) {
    const pattern = `%${query.q.trim()}%`;
    conditions.push(
      or(
        ilike(stores.name, pattern),
        ilike(stores.slug, pattern),
        ilike(merchants.name, pattern),
        ilike(merchants.slug, pattern),
      ),
    );
  }

  if (query.status === 'active') {
    conditions.push(and(eq(stores.active, true), eq(merchants.active, true)));
  } else if (query.status === 'suspended') {
    conditions.push(or(eq(stores.active, false), eq(merchants.active, false)));
  }

  if (query.plano) {
    conditions.push(eq(merchants.maxStores, planToMaxStores(query.plano)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const baseQuery = masterDb
    .select({
      id: stores.id,
      slug: stores.slug,
      name: stores.name,
      active: stores.active,
      createdAt: stores.createdAt,
      merchantActive: merchants.active,
      maxStores: merchants.maxStores,
      merchantName: merchants.name,
      merchantSlug: merchants.slug,
      billingStatus: merchantBilling.status,
      trialEndsAt: merchantBilling.trialEndsAt,
    })
    .from(stores)
    .innerJoin(merchants, eq(stores.merchantId, merchants.id))
    .leftJoin(merchantBilling, eq(merchantBilling.merchantId, merchants.id));

  const filtered = whereClause ? baseQuery.where(whereClause) : baseQuery;

  const [countRow] = await masterDb
    .select({ count: sql<number>`count(*)::int` })
    .from(stores)
    .innerJoin(merchants, eq(stores.merchantId, merchants.id))
    .where(whereClause ?? sql`true`);

  const rows = await filtered
    .orderBy(sql`${stores.createdAt} DESC NULLS LAST`, sql`${stores.id} DESC`)
    .limit(limit)
    .offset(offset);

  return {
    items: rows.map(toPlatformStoreListItem),
    total: countRow?.count ?? 0,
    page,
    limit,
  };
}

/** KPIs master-only para o dashboard Platform Ops (P1). */
export async function getPlatformDashboardStats(): Promise<PlatformDashboardStats> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [storeStats] = await masterDb
    .select({
      totalStores: sql<number>`count(*)::int`,
      activeStores: sql<number>`count(*) filter (where ${stores.active} = true and ${merchants.active} = true)::int`,
      suspendedStores: sql<number>`count(*) filter (where ${stores.active} = false or ${merchants.active} = false)::int`,
      newStores30d: sql<number>`count(*) filter (where ${stores.createdAt} >= ${thirtyDaysAgo})::int`,
    })
    .from(stores)
    .innerJoin(merchants, eq(stores.merchantId, merchants.id));

  const [merchantStats] = await masterDb
    .select({ totalMerchants: sql<number>`count(*)::int` })
    .from(merchants);

  const [trialStats] = await masterDb
    .select({
      trialsExpiring7d: sql<number>`count(*)::int`,
    })
    .from(merchantBilling)
    .where(
      and(
        eq(merchantBilling.status, 'trialing'),
        sql`${merchantBilling.trialEndsAt} >= NOW()`,
        sql`${merchantBilling.trialEndsAt} <= NOW() + INTERVAL '7 days'`,
      ),
    );

  return {
    totalStores: storeStats?.totalStores ?? 0,
    activeStores: storeStats?.activeStores ?? 0,
    suspendedStores: storeStats?.suspendedStores ?? 0,
    newStores30d: storeStats?.newStores30d ?? 0,
    totalMerchants: merchantStats?.totalMerchants ?? 0,
    trialsExpiring7d: trialStats?.trialsExpiring7d ?? 0,
    orders30d: null,
    gmv30dCents: null,
    gmvGrowthPct: null,
    topStore: null,
  };
}

export type ListPlatformMerchantsQuery = {
  q?: string;
  status?: 'active' | 'suspended';
  page?: number;
  limit?: number;
};

export type ListPlatformMerchantsResult = {
  items: PlatformMerchantListItem[];
  total: number;
  page: number;
  limit: number;
};

/** Lista paginada de contas merchant para o Platform Hub (P3). */
export async function listPlatformMerchantsQuery(
  query: ListPlatformMerchantsQuery,
): Promise<ListPlatformMerchantsResult> {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 20));
  const offset = (page - 1) * limit;

  const conditions = [];

  if (query.q?.trim()) {
    const pattern = `%${query.q.trim()}%`;
    conditions.push(or(ilike(merchants.name, pattern), ilike(merchants.slug, pattern)));
  }

  if (query.status === 'active') {
    conditions.push(eq(merchants.active, true));
  } else if (query.status === 'suspended') {
    conditions.push(eq(merchants.active, false));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRow] = await masterDb
    .select({ count: sql<number>`count(*)::int` })
    .from(merchants)
    .where(whereClause ?? sql`true`);

  const rows = await masterDb
    .select({
      id: merchants.id,
      slug: merchants.slug,
      name: merchants.name,
      active: merchants.active,
      maxStores: merchants.maxStores,
      createdAt: merchants.createdAt,
      storesCount: sql<number>`count(${stores.id})::int`,
    })
    .from(merchants)
    .leftJoin(stores, eq(stores.merchantId, merchants.id))
    .where(whereClause ?? sql`true`)
    .groupBy(merchants.id)
    .orderBy(sql`${merchants.createdAt} DESC NULLS LAST`, sql`${merchants.id} DESC`)
    .limit(limit)
    .offset(offset);

  return {
    items: rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      ativo: row.active ?? true,
      plano: maxStoresToPlano(row.maxStores),
      storesCount: row.storesCount,
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    })),
    total: countRow?.count ?? 0,
    page,
    limit,
  };
}

export async function getPlatformStoreBySlug(slug: string): Promise<PlatformStoreDetail | null> {
  const [row] = await masterDb
    .select({
      id: stores.id,
      slug: stores.slug,
      name: stores.name,
      active: stores.active,
      createdAt: stores.createdAt,
      merchantId: merchants.id,
      merchantSlug: merchants.slug,
      merchantName: merchants.name,
      merchantActive: merchants.active,
      maxStores: merchants.maxStores,
      billingStatus: merchantBilling.status,
      trialEndsAt: merchantBilling.trialEndsAt,
    })
    .from(stores)
    .innerJoin(merchants, eq(stores.merchantId, merchants.id))
    .leftJoin(merchantBilling, eq(merchantBilling.merchantId, merchants.id))
    .where(eq(stores.slug, slug))
    .limit(1);

  if (!row) return null;

  const base = toPlatformStore(row);
  const { health } = computeStoreHealth({
    ativo: base.ativo,
    billingStatus: row.billingStatus,
    trialEndsAt: row.trialEndsAt,
  });

  return {
    ...base,
    merchantId: row.merchantId,
    merchantSlug: row.merchantSlug,
    merchantName: row.merchantName,
    health,
  };
}

/** KPIs e saúde por loja (P4). Agregação cross-tenant de pedidos ainda indisponível. */
export async function getPlatformStoreMetricsBySlug(
  slug: string,
): Promise<PlatformStoreMetrics | null> {
  const store = await getPlatformStoreBySlug(slug);
  if (!store) return null;

  const [row] = await masterDb
    .select({
      billingStatus: merchantBilling.status,
      trialEndsAt: merchantBilling.trialEndsAt,
    })
    .from(stores)
    .innerJoin(merchants, eq(stores.merchantId, merchants.id))
    .leftJoin(merchantBilling, eq(merchantBilling.merchantId, merchants.id))
    .where(eq(stores.slug, slug))
    .limit(1);

  const { health, reasons } = computeStoreHealth({
    ativo: store.ativo,
    billingStatus: row?.billingStatus,
    trialEndsAt: row?.trialEndsAt ?? null,
  });

  return {
    orders30d: null,
    gmv30dCents: null,
    lastOrderAt: null,
    health,
    healthReasons: reasons,
  };
}

/** Billing read-only da conta merchant vinculada à loja (P4). */
export async function getPlatformStoreBillingBySlug(
  slug: string,
): Promise<PlatformStoreBilling | null> {
  const store = await getPlatformStoreBySlug(slug);
  if (!store) return null;

  const billing = await getMerchantBilling(store.merchantId);
  if (!billing) {
    return {
      status: null,
      planSlug: null,
      planName: null,
      monthlyFee: null,
      trialEndsAt: null,
      nextBillingDate: null,
      invoicesCount: 0,
    };
  }

  const invoices = await listMerchantInvoices(store.merchantId, 100);

  return {
    status: (billing.status as string | null) ?? null,
    planSlug: (billing.plan_slug as string | null) ?? null,
    planName: (billing.plan_name as string | null) ?? null,
    monthlyFee: billing.monthly_fee != null ? Number(billing.monthly_fee) : null,
    trialEndsAt: billing.trial_ends_at
      ? new Date(billing.trial_ends_at as string).toISOString()
      : null,
    nextBillingDate: billing.next_billing_date
      ? new Date(billing.next_billing_date as string).toISOString()
      : null,
    invoicesCount: invoices.length,
  };
}

/** Resumo de saúde operacional da plataforma (P4). */
export async function getPlatformHealthSummary(): Promise<PlatformHealthSummary> {
  const rows = await masterDb
    .select({
      slug: stores.slug,
      name: stores.name,
      merchantSlug: merchants.slug,
      active: stores.active,
      merchantActive: merchants.active,
      billingStatus: merchantBilling.status,
      trialEndsAt: merchantBilling.trialEndsAt,
    })
    .from(stores)
    .innerJoin(merchants, eq(stores.merchantId, merchants.id))
    .leftJoin(merchantBilling, eq(merchantBilling.merchantId, merchants.id))
    .orderBy(sql`${stores.createdAt} DESC NULLS LAST`, sql`${stores.id} DESC`);

  let healthyStores = 0;
  let attentionStores = 0;
  let suspendedStores = 0;
  const items: PlatformHealthItem[] = [];

  for (const row of rows) {
    const ativo = isStoreActive(row.active, row.merchantActive);
    const { health, reasons } = computeStoreHealth({
      ativo,
      billingStatus: row.billingStatus,
      trialEndsAt: row.trialEndsAt,
    });

    if (health === 'healthy') healthyStores += 1;
    else if (health === 'attention') attentionStores += 1;
    else suspendedStores += 1;

    if (health !== 'healthy') {
      items.push({
        slug: row.slug,
        nome: row.name,
        merchantSlug: row.merchantSlug,
        health,
        reasons,
      });
    }
  }

  const [trialStats] = await masterDb
    .select({ trialsExpiring7d: sql<number>`count(*)::int` })
    .from(merchantBilling)
    .where(
      and(
        eq(merchantBilling.status, 'trialing'),
        sql`${merchantBilling.trialEndsAt} >= NOW()`,
        sql`${merchantBilling.trialEndsAt} <= NOW() + INTERVAL '7 days'`,
      ),
    );

  const [noBillingStats] = await masterDb
    .select({ count: sql<number>`count(*)::int` })
    .from(merchants)
    .leftJoin(merchantBilling, eq(merchantBilling.merchantId, merchants.id))
    .where(sql`${merchantBilling.id} IS NULL`);

  return {
    healthyStores,
    attentionStores,
    suspendedStores,
    trialsExpiring7d: trialStats?.trialsExpiring7d ?? 0,
    merchantsWithoutBilling: noBillingStats?.count ?? 0,
    items: items.slice(0, 50),
  };
}

/** Relatórios operacionais master-only (P4). */
export async function getPlatformReportsSummary(): Promise<PlatformReportsSummary> {
  const [merchantStats] = await masterDb
    .select({
      totalMerchants: sql<number>`count(*)::int`,
      trialingMerchants: sql<number>`count(*) filter (where ${merchantBilling.status} = 'trialing')::int`,
      activeBillingMerchants: sql<number>`count(*) filter (where ${merchantBilling.status} = 'active')::int`,
    })
    .from(merchants)
    .leftJoin(merchantBilling, eq(merchantBilling.merchantId, merchants.id));

  const [trialStats] = await masterDb
    .select({ trialsExpiring7d: sql<number>`count(*)::int` })
    .from(merchantBilling)
    .where(
      and(
        eq(merchantBilling.status, 'trialing'),
        sql`${merchantBilling.trialEndsAt} >= NOW()`,
        sql`${merchantBilling.trialEndsAt} <= NOW() + INTERVAL '7 days'`,
      ),
    );

  const recentRows = await masterDb
    .select({
      slug: stores.slug,
      name: stores.name,
      createdAt: stores.createdAt,
    })
    .from(stores)
    .orderBy(sql`${stores.createdAt} DESC NULLS LAST`, sql`${stores.id} DESC`)
    .limit(10);

  let revenueMonth: PlatformReportsSummary['revenueMonth'] = null;
  try {
    const report = await getMerchantRevenueReport();
    if (!('error' in report)) {
      revenueMonth = {
        month: report.month,
        total: report.revenue.total,
        paidInvoices: report.invoices.paid,
        pendingInvoices: report.invoices.pending,
      };
    }
  } catch {
    revenueMonth = null;
  }

  return {
    totalMerchants: merchantStats?.totalMerchants ?? 0,
    trialingMerchants: merchantStats?.trialingMerchants ?? 0,
    activeBillingMerchants: merchantStats?.activeBillingMerchants ?? 0,
    trialsExpiring7d: trialStats?.trialsExpiring7d ?? 0,
    revenueMonth,
    recentStores: recentRows.map((row) => ({
      slug: row.slug,
      nome: row.name,
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    })),
  };
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
