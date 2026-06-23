import type { DashboardChartsData, DashboardPeriodo } from '@lojao/types/dashboard';
import { DASHBOARD_PERIODOS } from '@lojao/types/dashboard';
import { testIds } from '@lojao/test-utils';
import {
  adminEmptyStateClass,
  adminMutedClass,
  adminPeriodPillClass,
  adminSectionTitleClass,
  adminSegmentedControlClass,
  cn,
  Skeleton,
} from '@lojao/ui';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { apiFetch } from '../../../lib/api-client';
import { OrdersByStatusChart } from './orders-by-status-chart';
import { PaymentMethodsChart } from './payment-methods-chart';
import { PERIOD_LABELS } from './chart-utils';
import { RevenueChart } from './revenue-chart';
import { TopProductsChart } from './top-products-chart';

function fetchCharts(periodo: DashboardPeriodo) {
  return apiFetch<{ data: DashboardChartsData }>(
    `/api/v1/admin/dashboard/charts?periodo=${periodo}`,
  ).then((r) => r.data);
}

function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Skeleton className="h-[360px] rounded-xl bg-[var(--admin-surface-elevated)] lg:col-span-2" />
      <Skeleton className="h-[360px] rounded-xl bg-[var(--admin-surface-elevated)]" />
      <Skeleton className="h-[360px] rounded-xl bg-[var(--admin-surface-elevated)]" />
      <Skeleton className="h-[360px] rounded-xl bg-[var(--admin-surface-elevated)]" />
    </div>
  );
}

function isChartsEmpty(data: DashboardChartsData): boolean {
  return (
    data.receita_por_dia.length === 0 &&
    data.pedidos_por_status.length === 0 &&
    data.receita_por_metodo.length === 0 &&
    data.top_produtos.length === 0
  );
}

export function DashboardCharts() {
  const [periodo, setPeriodo] = useState<DashboardPeriodo>('30d');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'dashboard', 'charts', periodo],
    queryFn: () => fetchCharts(periodo),
  });

  return (
    <section className="mb-8" data-testid={testIds.admin.dashboardCharts}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className={adminSectionTitleClass()}>Análise do período</h2>
        <div className={adminSegmentedControlClass()}>
          {DASHBOARD_PERIODOS.map((p) => (
            <button
              key={p}
              type="button"
              data-testid={testIds.admin.dashboardChartPeriod(p)}
              onClick={() => setPeriodo(p)}
              className={adminPeriodPillClass(periodo === p)}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {isError && (
        <p className="ds-alert-error mb-4">Não foi possível carregar os gráficos.</p>
      )}

      {isLoading && <ChartsSkeleton />}

      {!isLoading && data && isChartsEmpty(data) && (
        <div data-testid={testIds.admin.dashboardChartEmpty} className={adminEmptyStateClass()}>
          <p className={cn('text-sm', adminMutedClass())}>Nenhum pedido no período selecionado.</p>
        </div>
      )}

      {!isLoading && data && !isChartsEmpty(data) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChart data={data.receita_por_dia} />
          </div>
          <OrdersByStatusChart data={data.pedidos_por_status} />
          <PaymentMethodsChart data={data.receita_por_metodo} />
          <TopProductsChart data={data.top_produtos} />
        </div>
      )}
    </section>
  );
}
