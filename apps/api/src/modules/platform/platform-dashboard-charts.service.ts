import { createMasterDb, and, eq, merchantBilling, merchants, sql, stores } from '@lojao/db';
import type {
  PlatformDashboardChartsData,
  PlatformBillingStatus,
  PlatformLojasPorDia,
  PlatformLojasPorPlano,
  PlatformSaudeLojas,
} from '@lojao/types';
import type { DashboardPeriodo } from '@lojao/types/dashboard';
import { MERCHANT_PLAN_MAX_STORES } from '@lojao/types/merchant';

import { masterPool } from '../../lib/master-db.js';
import { parseDashboardPeriodo } from '../admin/order-analytics.js';
import { computeStoreHealth } from './platform.service.js';

const masterDb = createMasterDb(masterPool);

function maxStoresToPlano(maxStores: number): 'starter' | 'professional' | 'enterprise' {
  if (maxStores >= MERCHANT_PLAN_MAX_STORES.enterprise) return 'enterprise';
  if (maxStores >= MERCHANT_PLAN_MAX_STORES.professional) return 'professional';
  return 'starter';
}

function formatDia(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toISOString().slice(0, 10);
}

function fillLojasPorDia(
  rows: Array<{ dia: string; total: number }>,
  dataInicio: Date,
  dataFim: Date,
): PlatformLojasPorDia[] {
  const map = new Map(rows.map((r) => [r.dia, r.total]));
  const result: PlatformLojasPorDia[] = [];
  const cur = new Date(dataInicio);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(dataFim);
  end.setHours(0, 0, 0, 0);

  while (cur <= end) {
    const dia = formatDia(cur);
    result.push({ dia, lojas: map.get(dia) ?? 0 });
    cur.setDate(cur.getDate() + 1);
  }

  return result;
}

/** Gráficos operacionais master-only — GET `/platform/dashboard/charts`. */
export async function getPlatformDashboardCharts(
  periodo: DashboardPeriodo,
): Promise<PlatformDashboardChartsData> {
  const { dataInicio, dataFim } = parseDashboardPeriodo(periodo);

  const storeDayRows = await masterDb
    .select({
      dia: sql<string>`to_char(date_trunc('day', ${stores.createdAt}), 'YYYY-MM-DD')`,
      total: sql<number>`count(*)::int`,
    })
    .from(stores)
    .where(
      and(
        sql`${stores.createdAt} >= ${dataInicio}`,
        sql`${stores.createdAt} <= ${dataFim}`,
      ),
    )
    .groupBy(sql`date_trunc('day', ${stores.createdAt})`)
    .orderBy(sql`date_trunc('day', ${stores.createdAt})`);

  const lojas_por_dia = fillLojasPorDia(
    storeDayRows.map((r) => ({ dia: r.dia, total: r.total })),
    dataInicio,
    dataFim,
  );

  const healthRows = await masterDb
    .select({
      active: stores.active,
      merchantActive: merchants.active,
      billingStatus: merchantBilling.status,
      trialEndsAt: merchantBilling.trialEndsAt,
    })
    .from(stores)
    .innerJoin(merchants, eq(stores.merchantId, merchants.id))
    .leftJoin(merchantBilling, eq(merchantBilling.merchantId, merchants.id));

  const healthCounts: Record<'healthy' | 'attention' | 'suspended', number> = {
    healthy: 0,
    attention: 0,
    suspended: 0,
  };

  for (const row of healthRows) {
    const ativo = (row.active ?? true) && (row.merchantActive ?? true);
    const { health } = computeStoreHealth({
      ativo,
      billingStatus: row.billingStatus,
      trialEndsAt: row.trialEndsAt,
    });
    healthCounts[health] += 1;
  }

  const saude_lojas: PlatformSaudeLojas[] = (
    ['healthy', 'attention', 'suspended'] as const
  ).map((health) => ({
    health,
    total: healthCounts[health],
  }));

  const billingRows = await masterDb
    .select({
      status: sql<string>`coalesce(${merchantBilling.status}, 'sem_billing')`,
      total: sql<number>`count(*)::int`,
    })
    .from(merchants)
    .leftJoin(merchantBilling, eq(merchantBilling.merchantId, merchants.id))
    .groupBy(sql`coalesce(${merchantBilling.status}, 'sem_billing')`)
    .orderBy(sql`count(*) DESC`);

  const billing_merchants: PlatformBillingStatus[] = billingRows.map((r) => ({
    status: r.status,
    total: r.total,
  }));

  const storePlanRows = await masterDb
    .select({ maxStores: merchants.maxStores })
    .from(stores)
    .innerJoin(merchants, eq(stores.merchantId, merchants.id));

  const planCounts: Record<'starter' | 'professional' | 'enterprise', number> = {
    starter: 0,
    professional: 0,
    enterprise: 0,
  };
  for (const row of storePlanRows) {
    const plano = maxStoresToPlano(row.maxStores);
    planCounts[plano] += 1;
  }

  const lojas_por_plano: PlatformLojasPorPlano[] = (
    ['starter', 'professional', 'enterprise'] as const
  )
    .map((plano) => ({ plano, total: planCounts[plano] }))
    .filter((row) => row.total > 0);

  return {
    periodo,
    lojas_por_dia,
    saude_lojas,
    billing_merchants,
    lojas_por_plano,
  };
}
