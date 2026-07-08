import type { PublicProduct } from '@lojao/types/public-store';

import type { StoreScope } from '../../lib/store-scope.js';
import { getRatingSummariesByProductIds } from '../reviews/reviews.service.js';
import {
  countWishlist,
  deleteWishlistItem,
  findWishlistProductIds,
  findWishlistProductRows,
  insertWishlistItem,
  productExistsInStore,
} from './wishlist.repository.js';

function toNum(v: string | number | null | undefined): number {
  return Number(v ?? 0);
}

function mapPublicProduct(row: Record<string, unknown>): PublicProduct {
  return {
    id: Number(row.id),
    nome: String(row.nome),
    subtitulo: row.subtitulo == null ? null : String(row.subtitulo),
    valor: toNum(row.valor as string | number | null | undefined),
    estoque: row.estoque == null ? null : Number(row.estoque),
    categoria_id: row.categoria_id == null ? null : Number(row.categoria_id),
    primeira_imagem: row.primeira_imagem == null ? null : String(row.primeira_imagem),
  };
}

export async function listWishlistProducts(
  scope: StoreScope,
  buyerId: number,
): Promise<PublicProduct[]> {
  const rows = await findWishlistProductRows(scope, buyerId);
  const products = rows.map(mapPublicProduct);
  const ratingMap = await getRatingSummariesByProductIds(
    scope,
    products.map((p) => p.id),
  );

  return products.map((p) => {
    const summary = ratingMap.get(p.id);
    return summary ? { ...p, rating_summary: summary } : p;
  });
}

export async function listWishlistProductIds(
  scope: StoreScope,
  buyerId: number,
): Promise<number[]> {
  return findWishlistProductIds(scope, buyerId);
}

export async function countWishlistItems(scope: StoreScope, buyerId: number): Promise<number> {
  return countWishlist(scope, buyerId);
}

export async function addWishlistItem(
  scope: StoreScope,
  buyerId: number,
  productId: number,
): Promise<{ added: boolean } | { error: string; code: string; status: number }> {
  const exists = await productExistsInStore(scope, productId);
  if (!exists) {
    return { error: 'Produto não encontrado.', code: 'NOT_FOUND', status: 404 };
  }

  await insertWishlistItem(scope, buyerId, productId);
  return { added: true };
}

export async function removeWishlistItem(
  scope: StoreScope,
  buyerId: number,
  productId: number,
): Promise<boolean> {
  return deleteWishlistItem(scope, buyerId, productId);
}
