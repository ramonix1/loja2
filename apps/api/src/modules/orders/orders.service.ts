import { orderStatusToApi } from '../../lib/merchant-schema-map.js';
import type { StoreScope } from '../../lib/store-scope.js';

export interface BuyerOrderRow {
  id: number;
  status: string;
  total: number;
  metodo_pagamento: string | null;
  created_at: string;
  total_itens: number;
}

/** Lista pedidos do comprador autenticado — espelha `checkoutController.meusPedidos`. */
export async function listBuyerOrders(scope: StoreScope, buyerId: number): Promise<BuyerOrderRow[]> {
  const res = await scope.pool.query(
    `
    SELECT o.id, o.status, o.total, o.payment_method AS metodo_pagamento, o.created_at,
           COUNT(oi.id)::int AS total_itens
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id AND oi.store_id = o.store_id
    WHERE o.buyer_id = $1 AND o.store_id = $2
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `,
    [buyerId, scope.storeId],
  );

  return res.rows.map((row) => ({
    id: Number(row.id),
    status: orderStatusToApi(String(row.status)),
    total: Number(row.total),
    metodo_pagamento: row.metodo_pagamento == null ? null : String(row.metodo_pagamento),
    created_at: String(row.created_at),
    total_itens: Number(row.total_itens ?? 0),
  }));
}
