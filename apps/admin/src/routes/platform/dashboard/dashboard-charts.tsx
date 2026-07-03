import type { PlatformDashboardChartsData } from '@lojao/types';
import { DASHBOARD_PERIODOS, type DashboardPeriodo } from '@lojao/types/dashboard';
import { testIds } from '@lojao/test-utils';
import { cn, platformMutedClass, Skeleton } from '@lojao/ui';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { getPlatformDashboardCharts } from '../../../lib/platform-api';
import { BillingStatusChart } from './billing-status-chart';
import { PERIOD_LABELS } from './chart-utils';
import { NewStoresChart } from './new-stores-chart';
import { StoreHealthChart } from './store-health-chart';
import { StoresByPlanChart } from './stores-by-plan-chart';

function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Skeleton className="h-[360px] rounded-xl bg-[var(--platform-surface-elevated)]" />
      <Skeleton className="h-[360px] rounded-xl bg-[var(--platform-surface-elevated)]" />
      <Skeleton className="h-[360px] rounded-xl bg-[var(--platform-surface-elevated)]" />
      <Skeleton className="h-[360px] rounded-xl bg-[var(--platform-surface-elevated)]" />
    </div>
  );
}

function isChartsEmpty(data: PlatformDashboardChartsData): boolean {
  const hasStores = data.lojas_por_dia.some((d) => d.lojas > 0);
  const hasHealth = data.saude_lojas.some((d) => d.total > 0);
  return !hasStores && !hasHealth && data.billing_merchants.length === 0 && data.lojas_por_plano.length === 0;
}

export function PlatformDashboardCharts() {
  const [periodo, setPeriodo] = useState<DashboardPeriodo>('30d');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['platform', 'dashboard', 'charts', periodo],
    queryFn: () => getPlatformDashboardCharts(periodo),
  });

  return (
    <section className="mb-8 mt-4" data-testid={testIds.platform.dashboardCharts}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-[var(--platform-text)]">Análise operacional</h2>
        <div className="flex gap-1 rounded-lg border border-[var(--platform-border)] bg-[var(--platform-surface)] p-1">
          {DASHBOARD_PERIODOS.map((p) => (
            <button
              key={p}
              type="button"
              data-testid={testIds.platform.dashboardChartPeriod(p)}
              onClick={() => setPeriodo(p)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors touch-manipulation',
                periodo === p
                  ? 'bg-[var(--platform-accent)] text-[var(--ata-verde-conde)]'
                  : 'text-[var(--platform-text-muted)] hover:bg-[var(--platform-sidebar-hover-bg)] hover:text-[var(--platform-text)]',
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <p className="mb-4 rounded-lg border border-[var(--platform-error)]/30 bg-[var(--platform-error-bg)] px-4 py-3 text-sm text-[var(--platform-text)]">
          Não foi possível carregar os gráficos.
        </p>
      ) : null}

      {isLoading ? <ChartsSkeleton /> : null}

      {!isLoading && data && isChartsEmpty(data) ? (
        <div
          data-testid={testIds.platform.dashboardChartEmpty}
          className="rounded-xl border border-dashed border-[var(--platform-border)] bg-[var(--platform-surface)]/50 px-6 py-16 text-center"
        >
          <p className={cn('text-sm', platformMutedClass())}>
            Ainda não há dados suficientes para os gráficos do período.
          </p>
        </div>
      ) : null}

      {!isLoading && data && !isChartsEmpty(data) ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <NewStoresChart data={data.lojas_por_dia} />
          <StoreHealthChart data={data.saude_lojas} />
          <BillingStatusChart data={data.billing_merchants} />
          <StoresByPlanChart data={data.lojas_por_plano} />
        </div>
      ) : null}
    </section>
  );
}
