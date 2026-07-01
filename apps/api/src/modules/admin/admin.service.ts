import type { DashboardChartsData, DashboardPeriodo } from '@lojao/types/dashboard';
import type { PedidoDetalhe, PedidoRecente, UpdatePedidoStatusInput } from '@lojao/types/pedidos';
import type { TenantDatabase } from '@lojao/db';
import type pg from 'pg';

import type { PedidoResumo, PedidosQuery } from './admin.schema.js';
import {
  fetchDashboardStatsRows,
  fetchPedidoById,
  fetchPedidosList,
  updatePedidoStatusRow,
} from './admin.repository.js';
import {
  fetchPedidosPorStatus,
  fetchReceitaPorDia,
  fetchReceitaPorMetodo,
  fetchTopProdutos,
  parseDashboardPeriodo,
} from './order-analytics.js';

export interface DashboardStats {
  pedidos_hoje: number;
  pedidos_pendentes: number;
  receita_mes: number;
  produtos_ativos: number;
  total_categorias: number;
  total_banners: number;
  total_pedidos: number;
  receita_total: number;
  pedidos_recentes: PedidoRecente[];
}

export type { PedidoResumo } from './admin.schema.js';

/**
 * Estatísticas do dashboard admin. Porta as queries de
 * `produtoController.dashboard` / `checkoutController.adminPedidos`, adaptadas
 * para os 4 cards da Fase 2. (Tabela `produtos` não tem flag `ativo`, então
 * `produtos_ativos` = total de produtos, igual ao card do legacy.)
 */
export async function getDashboardStats(db: pg.Pool): Promise<DashboardStats> {
  const { hoje, pendentes, receita, produtos, categorias, banners, totalPedidos, receitaTotal, recentes } =
    await fetchDashboardStatsRows(db);

  return {
    pedidos_hoje: hoje.rows[0]?.c ?? 0,
    pedidos_pendentes: pendentes.rows[0]?.c ?? 0,
    receita_mes: Number(receita.rows[0]?.s ?? 0),
    produtos_ativos: produtos.rows[0]?.c ?? 0,
    total_categorias: categorias.rows[0]?.c ?? 0,
    total_banners: banners.rows[0]?.c ?? 0,
    total_pedidos: totalPedidos.rows[0]?.c ?? 0,
    receita_total: Number(receitaTotal.rows[0]?.s ?? 0),
    pedidos_recentes: recentes.rows.map((r) => ({
      id: Number(r.id),
      status: String(r.status),
      total: Number(r.total),
      created_at: String(r.created_at),
      metodo_pagamento: (r.metodo_pagamento as string | null) ?? null,
      cliente_nome: String(r.cliente_nome),
    })),
  };
}

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

/** Lista paginada de pedidos (read-only) com dados do cliente. */
export async function listPedidos(
  db: TenantDatabase,
  query: PedidosQuery,
): Promise<{ data: PedidoResumo[]; total: number }> {
  return fetchPedidosList(db, query);
}

export async function getPedidoById(db: pg.Pool, id: number): Promise<PedidoDetalhe | null> {
  return fetchPedidoById(db, id);
}

export async function updatePedidoStatus(
  db: pg.Pool,
  id: number,
  input: UpdatePedidoStatusInput,
): Promise<PedidoDetalhe | null> {
  await updatePedidoStatusRow(db, id, input);
  return getPedidoById(db, id);
}
