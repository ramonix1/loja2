import type { DashboardChartsData, DashboardPeriodo } from '@lojao/types/dashboard';
import type pg from 'pg';

import {
  fetchPedidosPorStatus,
  fetchReceitaPorDia,
  fetchReceitaPorMetodo,
  fetchTopProdutos,
  parseDashboardPeriodo,
} from './order-analytics.js';

export async function getDashboardCharts(
  db: pg.Pool,
  periodo: DashboardPeriodo,
): Promise<DashboardChartsData> {
  const { dataInicio, dataFim } = parseDashboardPeriodo(periodo);

  const [receita_por_dia, pedidos_por_status, receita_por_metodo, top_produtos] =
    await Promise.all([
      fetchReceitaPorDia(db, dataInicio, dataFim),
      fetchPedidosPorStatus(db, dataInicio, dataFim),
      fetchReceitaPorMetodo(db, dataInicio, dataFim),
      fetchTopProdutos(db, dataInicio, dataFim, 5),
    ]);

  return {
    periodo,
    receita_por_dia,
    pedidos_por_status,
    receita_por_metodo,
    top_produtos,
  };
}
