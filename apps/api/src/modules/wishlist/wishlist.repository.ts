import type { StoreScope } from '../../lib/store-scope.js';

const PRODUCT_FIELDS = `
  p.id, p.name AS nome, p.subtitle AS subtitulo, p.price AS valor, p.stock AS estoque,
  p.category_id AS categoria_id,
  (SELECT pi.url FROM product_images pi
   WHERE pi.product_id = p.id AND pi.store_id = p.store_id
   ORDER BY pi.id ASC LIMIT 1) AS primeira_imagem
`;

export async function findWishlistProductRows(
  scope: StoreScope,
  buyerId: number,
): Promise<Record<string, unknown>[]> {
  const res = await scope.pool.query(
    `SELECT ${PRODUCT_FIELDS}
     FROM wishlist_items w
     INNER JOIN products p ON p.id = w.product_id AND p.store_id = w.store_id
     WHERE w.store_id = $1 AND w.buyer_id = $2
     ORDER BY w.created_at DESC`,
    [scope.storeId, buyerId],
  );
  return res.rows as Record<string, unknown>[];
}

export async function findWishlistProductIds(
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

export async function countWishlist(scope: StoreScope, buyerId: number): Promise<number> {
  const res = await scope.pool.query(
    `SELECT COUNT(*)::int AS count FROM wishlist_items
     WHERE store_id = $1 AND buyer_id = $2`,
    [scope.storeId, buyerId],
  );
  return Number((res.rows[0] as { count: number } | undefined)?.count ?? 0);
}

export async function productExistsInStore(
  scope: StoreScope,
  productId: number,
): Promise<boolean> {
  const res = await scope.pool.query(
    'SELECT id FROM products WHERE id = $1 AND store_id = $2',
    [productId, scope.storeId],
  );
  return !!res.rows[0];
}

export async function insertWishlistItem(
  scope: StoreScope,
  buyerId: number,
  productId: number,
): Promise<void> {
  await scope.pool.query(
    `INSERT INTO wishlist_items (store_id, buyer_id, product_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (store_id, buyer_id, product_id) DO NOTHING`,
    [scope.storeId, buyerId, productId],
  );
}

export async function deleteWishlistItem(
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
