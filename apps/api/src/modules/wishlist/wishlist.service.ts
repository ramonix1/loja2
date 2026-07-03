import type { PublicProduct } from '@lojao/types/public-store';

import type { StoreScope } from '../../lib/store-scope.js';
import { getRatingSummariesByProductIds } from '../reviews/reviews.service.js';

const PRODUCT_FIELDS = `
  p.id, p.name AS nome, p.subtitle AS subtitulo, p.price AS valor, p.stock AS estoque,
  p.category_id AS categoria_id,
  (SELECT pi.url FROM product_images pi
   WHERE pi.product_id = p.id AND pi.store_id = p.store_id
   ORDER BY pi.id ASC LIMIT 1) AS primeira_imagem
`;

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
  const res = await scope.pool.query(
    `SELECT ${PRODUCT_FIELDS}
     FROM wishlist_items w
     INNER JOIN products p ON p.id = w.product_id AND p.store_id = w.store_id
     WHERE w.store_id = $1 AND w.buyer_id = $2
     ORDER BY w.created_at DESC`,
    [scope.storeId, buyerId],
  );

  const products = res.rows.map((row) => mapPublicProduct(row as Record<string, unknown>));
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
  const res = await scope.pool.query(
    `SELECT product_id FROM wishlist_items
     WHERE store_id = $1 AND buyer_id = $2
     ORDER BY created_at DESC`,
    [scope.storeId, buyerId],
  );
  return res.rows.map((row) => Number(row.product_id));
}

export async function countWishlistItems(scope: StoreScope, buyerId: number): Promise<number> {
  const res = await scope.pool.query(
    `SELECT COUNT(*)::int AS count FROM wishlist_items
     WHERE store_id = $1 AND buyer_id = $2`,
    [scope.storeId, buyerId],
  );
  return Number((res.rows[0] as { count: number } | undefined)?.count ?? 0);
}

export async function addWishlistItem(
  scope: StoreScope,
  buyerId: number,
  productId: number,
): Promise<{ added: boolean } | { error: string; code: string; status: number }> {
  const productRes = await scope.pool.query(
    'SELECT id FROM products WHERE id = $1 AND store_id = $2',
    [productId, scope.storeId],
  );
  if (!productRes.rows[0]) {
    return { error: 'Produto não encontrado.', code: 'NOT_FOUND', status: 404 };
  }

  await scope.pool.query(
    `INSERT INTO wishlist_items (store_id, buyer_id, product_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (store_id, buyer_id, product_id) DO NOTHING`,
    [scope.storeId, buyerId, productId],
  );

  return { added: true };
}

export async function removeWishlistItem(
  scope: StoreScope,
  buyerId: number,
  productId: number,
): Promise<boolean> {
  const res = await scope.pool.query(
    `DELETE FROM wishlist_items
     WHERE store_id = $1 AND buyer_id = $2 AND product_id = $3`,
    [scope.storeId, buyerId, productId],
  );
  return (res.rowCount ?? 0) > 0;
}
