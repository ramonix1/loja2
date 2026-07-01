import type pg from 'pg';

import {
  deleteCartItem as deleteCartItemRow,
  findCartItemQuantity,
  findCartItems,
  findProductById,
  findStockConfig,
  sumCartQuantities,
  sumReservedQuantity,
  updateCartItemQuantity,
  upsertCartItem,
} from './cart.repository.js';

export interface CartItem {
  id: number;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  produto_id: number;
  nome: string;
  subtitulo: string | null;
  imagem: string | null;
}

function mapCartItem(row: Record<string, unknown>): CartItem {
  return {
    ...row,
    quantidade: Number(row.quantidade),
    preco_unitario: parseFloat(String(row.preco_unitario)),
    subtotal: parseFloat(String(row.subtotal)),
    produto_id: Number(row.produto_id),
    id: Number(row.id),
  } as CartItem;
}

export async function getCartItems(db: pg.Pool, usuarioId: number): Promise<CartItem[]> {
  const rows = await findCartItems(db, usuarioId);
  return rows.map(mapCartItem);
}

export async function countCartItems(db: pg.Pool, usuarioId: number): Promise<number> {
  return sumCartQuantities(db, usuarioId);
}

export async function addCartItem(
  db: pg.Pool,
  usuarioId: number,
  produtoId: number,
  quantidade: number,
): Promise<{ contagem: number } | { error: string; code: string; status: number }> {
  const qtd = Math.max(1, quantidade);

  const prod = await findProductById(db, produtoId);
  if (!prod) {
    return { error: 'Produto não encontrado.', code: 'NOT_FOUND', status: 404 };
  }

  const cfgMap = await findStockConfig(db);

  const estoque = prod.estoque;
  if (cfgMap.controla_estoque === 'true' && estoque !== null) {
    if (cfgMap.reservar_estoque_carrinho === 'true') {
      const reservado = await sumReservedQuantity(db, produtoId);
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
      const noCarrinho = await findCartItemQuantity(db, usuarioId, produtoId);
      if (noCarrinho + qtd > estoque) {
        return {
          error: `Apenas ${Math.max(0, estoque - noCarrinho)} unidade(s) disponível(is).`,
          code: 'INSUFFICIENT_STOCK',
          status: 400,
        };
      }
    }
  }

  await upsertCartItem(db, usuarioId, produtoId, qtd, prod.valor);

  const contagem = await countCartItems(db, usuarioId);
  return { contagem };
}

export async function updateCartItem(
  db: pg.Pool,
  usuarioId: number,
  itemId: number,
  quantidade: number,
): Promise<{ contagem: number; total: string; itens: CartItem[] }> {
  if (!quantidade || quantidade < 1) {
    await deleteCartItemRow(db, itemId, usuarioId);
  } else {
    await updateCartItemQuantity(db, itemId, usuarioId, quantidade);
  }

  const itens = await getCartItems(db, usuarioId);
  const total = itens.reduce((s, i) => s + i.subtotal, 0);
  const contagem = itens.reduce((s, i) => s + i.quantidade, 0);
  return { contagem, total: total.toFixed(2), itens };
}

export async function removeCartItem(
  db: pg.Pool,
  usuarioId: number,
  itemId: number,
): Promise<{ contagem: number; total: string }> {
  await deleteCartItemRow(db, itemId, usuarioId);
  const itens = await getCartItems(db, usuarioId);
  const total = itens.reduce((s, i) => s + i.subtotal, 0);
  const contagem = itens.reduce((s, i) => s + i.quantidade, 0);
  return { contagem, total: total.toFixed(2) };
}
