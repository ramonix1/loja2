import type pg from 'pg';

import { findBuyerOrders, type BuyerOrderRow } from './orders.repository.js';

export type { BuyerOrderRow };

/** Lista pedidos do comprador autenticado — espelha `checkoutController.meusPedidos`. */
export async function listBuyerOrders(db: pg.Pool, usuarioId: number): Promise<BuyerOrderRow[]> {
  return findBuyerOrders(db, usuarioId);
}
