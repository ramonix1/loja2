import type { StoreScope } from '../../lib/store-scope.js';
import {
  deleteCartItem,
  findBuyerCartQuantity,
  findCartItems,
  findProductForCart,
  findReservedQuantity,
  findStoreInventoryConfig,
  setCartItemQuantity,
  upsertCartItem,
} from './cart.repository.js';

export type { CartItemRow as CartItem } from './cart.repository.js';

export async function getCartItems(scope: StoreScope, buyerId: number) {
  return findCartItems(scope, buyerId);
}

export async function countCartItems(scope: StoreScope, buyerId: number): Promise<number> {
  const items = await findCartItems(scope, buyerId);
  return items.reduce((sum, item) => sum + item.quantidade, 0);
}

export async function addCartItem(
  scope: StoreScope,
  buyerId: number,
  produtoId: number,
  quantidade: number,
): Promise<{ count: number } | { error: string; code: string; status: number }> {
  const qtd = Math.max(1, quantidade);

  const produto = await findProductForCart(scope, produtoId);
  if (!produto) {
    return { error: 'Produto não encontrado.', code: 'NOT_FOUND', status: 404 };
  }

  const cfgMap = await findStoreInventoryConfig(scope);
  const estoque = produto.estoque;

  if (cfgMap.controla_estoque === 'true' && estoque !== null) {
    if (cfgMap.reservar_estoque_carrinho === 'true') {
      const reservado = await findReservedQuantity(scope, produtoId);
      if (reservado + qtd > estoque) {
        const disponivel = Math.max(0, estoque - reservado);
        return {
          error:
            disponivel === 0
              ? 'Produto esgotado.'
              : `Apenas ${disponivel} unidade(s) disponível(is).`,
          code: 'INSUFFICIENT_STOCK',
          status: 400,
        };
      }
    } else {
      if (estoque <= 0) {
        return { error: 'Produto esgotado.', code: 'INSUFFICIENT_STOCK', status: 400 };
      }
      const noCarrinho = await findBuyerCartQuantity(scope, buyerId, produtoId);
      if (noCarrinho + qtd > estoque) {
        return {
          error: `Apenas ${Math.max(0, estoque - noCarrinho)} unidade(s) disponível(is).`,
          code: 'INSUFFICIENT_STOCK',
          status: 400,
        };
      }
    }
  }

  await upsertCartItem(scope, buyerId, produtoId, qtd, produto.valor);

  const count = await countCartItems(scope, buyerId);
  return { count };
}

export async function updateCartItem(
  scope: StoreScope,
  buyerId: number,
  itemId: number,
  quantidade: number,
): Promise<{ count: number; total: string; itens: Awaited<ReturnType<typeof findCartItems>> }> {
  if (!quantidade || quantidade < 1) {
    await deleteCartItem(scope, buyerId, itemId);
  } else {
    await setCartItemQuantity(scope, buyerId, itemId, quantidade);
  }

  const itens = await findCartItems(scope, buyerId);
  const total = itens.reduce((s, i) => s + i.subtotal, 0);
  const count = itens.reduce((s, i) => s + i.quantidade, 0);
  return { count, total: total.toFixed(2), itens };
}

export async function removeCartItem(
  scope: StoreScope,
  buyerId: number,
  itemId: number,
): Promise<{ count: number; total: string }> {
  await deleteCartItem(scope, buyerId, itemId);
  const itens = await findCartItems(scope, buyerId);
  const total = itens.reduce((s, i) => s + i.subtotal, 0);
  const count = itens.reduce((s, i) => s + i.quantidade, 0);
  return { count, total: total.toFixed(2) };
}
