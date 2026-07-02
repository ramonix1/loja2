import type { DashboardChartsData, DashboardPeriodo } from '@lojao/types/dashboard';

import type { StoreScope } from '../../lib/store-scope.js';
import {
  fetchPedidosPorStatus,
  fetchReceitaPorDia,
  fetchReceitaPorMetodo,
  fetchTopProdutos,
  parseDashboardPeriodo,
} from './order-analytics.js';

export async function getDashboardCharts(
  scope: StoreScope,
  periodo: DashboardPeriodo,
): Promise<DashboardChartsData> {
  const { dataInicio, dataFim } = parseDashboardPeriodo(periodo);

  const [receita_por_dia, pedidos_por_status, receita_por_metodo, top_produtos] =
    await Promise.all([
      fetchReceitaPorDia(scope, dataInicio, dataFim),
      fetchPedidosPorStatus(scope, dataInicio, dataFim),
      fetchReceitaPorMetodo(scope, dataInicio, dataFim),
      fetchTopProdutos(scope, dataInicio, dataFim, 5),
    ]);

  return {
    periodo,
    receita_por_dia,
    pedidos_por_status,
    receita_por_metodo,
    top_produtos,
  };
}
