/**
 * Agregações SQL compartilhadas entre dashboard charts e relatórios.
 * Regras de receita confirmada: status NOT IN ('cancelled', 'awaiting_payment').
 * Timezone: intervalo via Date JS + BETWEEN no Postgres (CURRENT_DATE implícito no servidor DB).
 */
import type { DashboardPeriodo } from '@lojao/types/dashboard';

import type { StoreScope } from '../../lib/store-scope.js';
import { orderStatusToApi } from '../../lib/merchant-schema-map.js';

export function toNum(v: string | number | null | undefined): number {
  return Number(v ?? 0);
}

function formatDia(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toISOString().slice(0, 10);
}

/** Converte periodo relativo em range [início do dia, fim do dia hoje]. */
export function parseDashboardPeriodo(periodo: DashboardPeriodo): {
  dataInicio: Date;
  dataFim: Date;
} {
  const dataFim = new Date();
  dataFim.setHours(23, 59, 59, 999);
  const dataInicio = new Date(dataFim);
  const offsetDays = periodo === '7d' ? 6 : periodo === '30d' ? 29 : 89;
  dataInicio.setDate(dataInicio.getDate() - offsetDays);
  dataInicio.setHours(0, 0, 0, 0);
  return { dataInicio, dataFim };
}

/** Receita confirmada e pedidos (não cancelados) por dia — usado em financeiro e dashboard. */
export async function fetchReceitaPorDia(
  { pool, storeId }: StoreScope,
  dataInicio: Date,
  dataFim: Date,
): Promise<Array<{ dia: string; receita: number; pedidos: number }>> {
  const res = await pool.query(
    `SELECT DATE_TRUNC('day', created_at) AS dia,
            COUNT(*) FILTER (WHERE status NOT IN ('cancelled'))::int AS pedidos,
            ROUND(COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelled','awaiting_payment')), 0), 2) AS receita
     FROM orders
     WHERE store_id = $3 AND created_at BETWEEN $1 AND $2
     GROUP BY dia
     ORDER BY dia`,
    [dataInicio, dataFim, storeId],
  );

  return res.rows.map((r) => ({
    dia: formatDia(r.dia as Date | string),
    receita: toNum(r.receita),
    pedidos: Number(r.pedidos ?? 0),
  }));
}

/** Contagem de todos os pedidos no período por status (inclui cancelados). */
export async function fetchPedidosPorStatus(
  { pool, storeId }: StoreScope,
  dataInicio: Date,
  dataFim: Date,
): Promise<Array<{ status: string; total: number }>> {
  const res = await pool.query(
    `SELECT status, COUNT(*)::int AS total
     FROM orders
     WHERE store_id = $3 AND created_at BETWEEN $1 AND $2
     GROUP BY status
     ORDER BY total DESC`,
    [dataInicio, dataFim, storeId],
  );

  return res.rows.map((r) => ({
    status: orderStatusToApi(String(r.status)),
    total: Number(r.total ?? 0),
  }));
}

/** Receita confirmada por método de pagamento. */
export async function fetchReceitaPorMetodo(
  { pool, storeId }: StoreScope,
  dataInicio: Date,
  dataFim: Date,
): Promise<Array<{ metodo: string; receita: number; pedidos: number }>> {
  const res = await pool.query(
    `SELECT COALESCE(payment_method, 'N/A') AS metodo,
            COUNT(*)::int AS pedidos,
            ROUND(COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelled','awaiting_payment')), 0), 2) AS receita
     FROM orders
     WHERE store_id = $3 AND created_at BETWEEN $1 AND $2
     GROUP BY payment_method
     ORDER BY receita DESC`,
    [dataInicio, dataFim, storeId],
  );

  return res.rows.map((r) => ({
    metodo: String(r.metodo),
    receita: toNum(r.receita),
    pedidos: Number(r.pedidos ?? 0),
  }));
}

/** Top produtos por quantidade vendida no período. */
export async function fetchTopProdutos(
  scope: StoreScope,
  dataInicio: Date,
  dataFim: Date,
  limit = 5,
): Promise<Array<{ nome: string; quantidade: number; receita: number }>> {
  const { pool, storeId } = scope;
  const res = await pool.query(
    `SELECT oi.product_name AS nome,
            SUM(oi.quantity)::int AS quantidade,
            ROUND(SUM(oi.subtotal), 2) AS receita
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id AND o.store_id = oi.store_id
     WHERE o.store_id = $4 AND o.created_at BETWEEN $1 AND $2
       AND o.status NOT IN ('cancelled')
     GROUP BY oi.product_name
     ORDER BY quantidade DESC
     LIMIT $3`,
    [dataInicio, dataFim, limit, storeId],
  );

  return res.rows.map((r) => ({
    nome: String(r.nome),
    quantidade: Number(r.quantidade ?? 0),
    receita: toNum(r.receita),
  }));
}
