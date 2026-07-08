import type { StoreScope } from '../../lib/store-scope.js';
import { type BuyerOrderRow, findBuyerOrders } from './orders.repository.js';

export type { BuyerOrderRow };

export async function listBuyerOrders(
  scope: StoreScope,
  buyerId: number,
): Promise<BuyerOrderRow[]> {
  return findBuyerOrders(scope, buyerId);
}
