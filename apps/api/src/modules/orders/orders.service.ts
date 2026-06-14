import type pg from 'pg';

export interface BuyerOrderRow {
  id: number;
  status: string;
  total: number;
  metodo_pagamento: string | null;
  created_at: string;
  total_itens: number;
}

/** Lista pedidos do comprador autenticado — espelha `checkoutController.meusPedidos`. */
export async function listBuyerOrders(db: pg.Pool, usuarioId: number): Promise<BuyerOrderRow[]> {
  const res = await db.query(
    `
    SELECT p.id, p.status, p.total, p.metodo_pagamento, p.created_at,
           COUNT(pi.id)::int AS total_itens
    FROM pedidos p
    LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
    WHERE p.usuario_id = $1
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `,
    [usuarioId],
  );

  return res.rows.map((row) => ({
    id: Number(row.id),
    status: String(row.status),
    total: Number(row.total),
    metodo_pagamento: row.metodo_pagamento == null ? null : String(row.metodo_pagamento),
    created_at: String(row.created_at),
    total_itens: Number(row.total_itens ?? 0),
  }));
}
