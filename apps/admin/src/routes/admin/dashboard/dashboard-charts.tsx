import type { DashboardChartsData, DashboardPeriodo } from '@lojao/types/dashboard';
import { DASHBOARD_PERIODOS } from '@lojao/types/dashboard';
import { testIds } from '@lojao/test-utils';
import { cn } from '@lojao/ui';
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
    <div className="grid animate-pulse grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="h-[360px] rounded-xl bg-gray-800 lg:col-span-2" />
      <div className="h-[360px] rounded-xl bg-gray-800" />
      <div className="h-[360px] rounded-xl bg-gray-800" />
      <div className="h-[360px] rounded-xl bg-gray-800" />
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
        <h2 className="text-base font-semibold text-white">Análise do período</h2>
        <div className="flex gap-1 rounded-lg border border-gray-800 bg-gray-900 p-1">
          {DASHBOARD_PERIODOS.map((p) => (
            <button
              key={p}
              type="button"
              data-testid={testIds.admin.dashboardChartPeriod(p)}
              onClick={() => setPeriodo(p)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                periodo === p
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200',
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {isError && (
        <p className="mb-4 rounded-lg border border-red-900 bg-red-950 px-4 py-3 text-sm text-red-300">
          Não foi possível carregar os gráficos.
        </p>
      )}

      {isLoading && <ChartsSkeleton />}

      {!isLoading && data && isChartsEmpty(data) && (
        <div
          data-testid={testIds.admin.dashboardChartEmpty}
          className="rounded-xl border border-dashed border-gray-700 bg-gray-900/50 px-6 py-16 text-center"
        >
          <p className="text-sm text-gray-400">
            Nenhum pedido no período selecionado.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Execute <code className="text-gray-400">make seed</code> para popular dados de
            desenvolvimento.
          </p>
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
