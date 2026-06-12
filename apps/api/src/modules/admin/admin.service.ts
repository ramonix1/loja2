import type pg from 'pg';

import type { PedidosQuery } from './admin.schemas.js';

export interface DashboardStats {
  pedidos_hoje: number;
  pedidos_pendentes: number;
  receita_mes: number;
  produtos_ativos: number;
}

export interface PedidoResumo {
  id: number;
  created_at: string;
  status: string;
  total: number;
  cliente_nome: string | null;
  cliente_email: string | null;
}

/**
 * Estatísticas do dashboard admin. Porta as queries de
 * `produtoController.dashboard` / `checkoutController.adminPedidos`, adaptadas
 * para os 4 cards da Fase 2. (Tabela `produtos` não tem flag `ativo`, então
 * `produtos_ativos` = total de produtos, igual ao card do legacy.)
 */
export async function getDashboardStats(db: pg.Pool): Promise<DashboardStats> {
  const [hoje, pendentes, receita, produtos] = await Promise.all([
    db.query<{ c: number }>(
      "SELECT COUNT(*)::int AS c FROM pedidos WHERE created_at::date = CURRENT_DATE",
    ),
    db.query<{ c: number }>(
      "SELECT COUNT(*)::int AS c FROM pedidos WHERE status = 'aguardando_pagamento'",
    ),
    db.query<{ s: string }>(
      "SELECT COALESCE(SUM(total), 0) AS s FROM pedidos WHERE status = 'pago' AND created_at >= date_trunc('month', CURRENT_DATE)",
    ),
    db.query<{ c: number }>('SELECT COUNT(*)::int AS c FROM produtos'),
  ]);

  return {
    pedidos_hoje: hoje.rows[0]?.c ?? 0,
    pedidos_pendentes: pendentes.rows[0]?.c ?? 0,
    receita_mes: Number(receita.rows[0]?.s ?? 0),
    produtos_ativos: produtos.rows[0]?.c ?? 0,
  };
}

/** Lista paginada de pedidos (read-only) com dados do cliente. */
export async function listPedidos(
  db: pg.Pool,
  { page, perPage, status }: PedidosQuery,
): Promise<{ data: PedidoResumo[]; total: number }> {
  const offset = (page - 1) * perPage;

  const totalRes = status
    ? await db.query<{ total: number }>(
        'SELECT COUNT(*)::int AS total FROM pedidos WHERE status = $1',
        [status],
      )
    : await db.query<{ total: number }>('SELECT COUNT(*)::int AS total FROM pedidos');

  const rowsRes = status
    ? await db.query(
        `SELECT p.id, p.created_at, p.status, p.total,
                u.nome AS cliente_nome, u.email AS cliente_email
         FROM pedidos p
         JOIN usuarios u ON u.id = p.usuario_id
         WHERE p.status = $3
         ORDER BY p.created_at DESC
         LIMIT $1 OFFSET $2`,
        [perPage, offset, status],
      )
    : await db.query(
        `SELECT p.id, p.created_at, p.status, p.total,
                u.nome AS cliente_nome, u.email AS cliente_email
         FROM pedidos p
         JOIN usuarios u ON u.id = p.usuario_id
         ORDER BY p.created_at DESC
         LIMIT $1 OFFSET $2`,
        [perPage, offset],
      );

  const data: PedidoResumo[] = rowsRes.rows.map(
    (row: {
      id: number;
      created_at: Date | string;
      status: string;
      total: string | number;
      cliente_nome: string | null;
      cliente_email: string | null;
    }) => ({
      id: row.id,
      created_at:
        row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      status: row.status,
      total: Number(row.total),
      cliente_nome: row.cliente_nome,
      cliente_email: row.cliente_email,
    }),
  );

  return { data, total: totalRes.rows[0]?.total ?? 0 };
}
