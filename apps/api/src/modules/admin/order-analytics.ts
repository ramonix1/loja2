/**
 * Agregações SQL compartilhadas entre dashboard charts e relatórios.
 * Regras de receita confirmada: status NOT IN ('cancelado', 'aguardando_pagamento').
 * Timezone: intervalo via Date JS + BETWEEN no Postgres (CURRENT_DATE implícito no servidor DB).
 */
import type { DashboardPeriodo } from '@lojao/types/dashboard';
import type pg from 'pg';

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
  db: pg.Pool,
  dataInicio: Date,
  dataFim: Date,
): Promise<Array<{ dia: string; receita: number; pedidos: number }>> {
  const res = await db.query(
    `SELECT DATE_TRUNC('day', created_at) AS dia,
            COUNT(*) FILTER (WHERE status NOT IN ('cancelado'))::int AS pedidos,
            ROUND(COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelado','aguardando_pagamento')), 0), 2) AS receita
     FROM pedidos
     WHERE created_at BETWEEN $1 AND $2
     GROUP BY dia
     ORDER BY dia`,
    [dataInicio, dataFim],
  );

  return res.rows.map((r) => ({
    dia: formatDia(r.dia as Date | string),
    receita: toNum(r.receita),
    pedidos: Number(r.pedidos ?? 0),
  }));
}

/** Contagem de todos os pedidos no período por status (inclui cancelados). */
export async function fetchPedidosPorStatus(
  db: pg.Pool,
  dataInicio: Date,
  dataFim: Date,
): Promise<Array<{ status: string; total: number }>> {
  const res = await db.query(
    `SELECT status, COUNT(*)::int AS total
     FROM pedidos
     WHERE created_at BETWEEN $1 AND $2
     GROUP BY status
     ORDER BY total DESC`,
    [dataInicio, dataFim],
  );

  return res.rows.map((r) => ({
    status: String(r.status),
    total: Number(r.total ?? 0),
  }));
}

/** Receita confirmada por método de pagamento. */
export async function fetchReceitaPorMetodo(
  db: pg.Pool,
  dataInicio: Date,
  dataFim: Date,
): Promise<Array<{ metodo: string; receita: number; pedidos: number }>> {
  const res = await db.query(
    `SELECT COALESCE(metodo_pagamento, 'N/A') AS metodo,
            COUNT(*)::int AS pedidos,
            ROUND(COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelado','aguardando_pagamento')), 0), 2) AS receita
     FROM pedidos
     WHERE created_at BETWEEN $1 AND $2
     GROUP BY metodo_pagamento
     ORDER BY receita DESC`,
    [dataInicio, dataFim],
  );

  return res.rows.map((r) => ({
    metodo: String(r.metodo),
    receita: toNum(r.receita),
    pedidos: Number(r.pedidos ?? 0),
  }));
}

/** Top produtos por quantidade vendida no período. */
export async function fetchTopProdutos(
  db: pg.Pool,
  dataInicio: Date,
  dataFim: Date,
  limit = 5,
): Promise<Array<{ nome: string; quantidade: number; receita: number }>> {
  const res = await db.query(
    `SELECT pi.nome_produto AS nome,
            SUM(pi.quantidade)::int AS quantidade,
            ROUND(SUM(pi.subtotal), 2) AS receita
     FROM pedido_itens pi
     JOIN pedidos p ON p.id = pi.pedido_id
     WHERE p.created_at BETWEEN $1 AND $2
       AND p.status NOT IN ('cancelado')
     GROUP BY pi.nome_produto
     ORDER BY quantidade DESC
     LIMIT $3`,
    [dataInicio, dataFim, limit],
  );

  return res.rows.map((r) => ({
    nome: String(r.nome),
    quantidade: Number(r.quantidade ?? 0),
    receita: toNum(r.receita),
  }));
}
