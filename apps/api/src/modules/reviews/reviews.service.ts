import type { AdminReview, PublicProductReview, ProductRatingSummary } from '@lojao/types/reviews';

import type { StoreScope } from '../../lib/store-scope.js';

function toIso(value: Date | string | null | undefined): string {
  if (value == null) return '';
  return value instanceof Date ? value.toISOString() : String(value);
}

function maskAuthorName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Comprador';
  if (parts.length === 1) return parts[0]!;
  return `${parts[0]} ${parts[1]![0]}.`;
}

export async function getRatingSummariesByProductIds(
  scope: StoreScope,
  productIds: number[],
): Promise<Map<number, ProductRatingSummary>> {
  const map = new Map<number, ProductRatingSummary>();
  if (productIds.length === 0) return map;

  try {
    const res = await scope.pool.query(
      `SELECT product_id,
              ROUND(AVG(rating)::numeric, 1)::float AS average,
              COUNT(*)::int AS count
       FROM product_reviews
       WHERE store_id = $1 AND product_id = ANY($2::int[]) AND status = 'approved'
       GROUP BY product_id`,
      [scope.storeId, productIds],
    );

    for (const row of res.rows as { product_id: number; average: number; count: number }[]) {
      if (row.count > 0) {
        map.set(row.product_id, { average: Number(row.average), count: row.count });
      }
    }
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === '42P01') return map;
    throw e;
  }

  return map;
}

export async function getRatingSummaryForProduct(
  scope: StoreScope,
  productId: number,
): Promise<ProductRatingSummary | null> {
  const map = await getRatingSummariesByProductIds(scope, [productId]);
  return map.get(productId) ?? null;
}

export async function buyerCanReviewProduct(
  scope: StoreScope,
  buyerId: number,
  productId: number,
): Promise<boolean> {
  const res = await scope.pool.query(
    `SELECT 1
     FROM orders o
     INNER JOIN order_items oi ON oi.order_id = o.id AND oi.store_id = o.store_id
     WHERE o.store_id = $1
       AND o.buyer_id = $2
       AND o.status = 'delivered'
       AND oi.product_id = $3
     LIMIT 1`,
    [scope.storeId, buyerId, productId],
  );
  return (res.rowCount ?? 0) > 0;
}

export async function listPublicProductReviews(
  scope: StoreScope,
  productId: number,
  page: number,
  limit: number,
): Promise<{ reviews: PublicProductReview[]; total: number }> {
  const offset = (page - 1) * limit;

  const [listRes, countRes] = await Promise.all([
    scope.pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, b.name AS buyer_name
       FROM product_reviews r
       INNER JOIN buyers b ON b.id = r.buyer_id AND b.store_id = r.store_id
       WHERE r.store_id = $1 AND r.product_id = $2 AND r.status = 'approved'
       ORDER BY r.created_at DESC
       LIMIT $3 OFFSET $4`,
      [scope.storeId, productId, limit, offset],
    ),
    scope.pool.query(
      `SELECT COUNT(*)::int AS total
       FROM product_reviews
       WHERE store_id = $1 AND product_id = $2 AND status = 'approved'`,
      [scope.storeId, productId],
    ),
  ]);

  const total = Number((countRes.rows[0] as { total: number } | undefined)?.total ?? 0);
  const reviews = listRes.rows.map((row) => ({
    id: Number(row.id),
    rating: Number(row.rating),
    comment: row.comment == null ? null : String(row.comment),
    author_name: maskAuthorName(String(row.buyer_name)),
    created_at: toIso(row.created_at as Date | string),
  }));

  return { reviews, total };
}

export async function createProductReview(
  scope: StoreScope,
  buyerId: number,
  productId: number,
  rating: number,
  comment: string | null | undefined,
): Promise<{ id: number } | { error: string; code: string; status: number }> {
  const productRes = await scope.pool.query(
    'SELECT id FROM products WHERE id = $1 AND store_id = $2',
    [productId, scope.storeId],
  );
  if (!productRes.rows[0]) {
    return { error: 'Produto não encontrado.', code: 'NOT_FOUND', status: 404 };
  }

  const eligible = await buyerCanReviewProduct(scope, buyerId, productId);
  if (!eligible) {
    return {
      error: 'Somente compradores com pedido entregue podem avaliar este produto.',
      code: 'FORBIDDEN',
      status: 403,
    };
  }

  try {
    const res = await scope.pool.query(
      `INSERT INTO product_reviews (store_id, product_id, buyer_id, rating, comment, status)
       VALUES ($1, $2, $3, $4, $5, 'approved')
       RETURNING id`,
      [scope.storeId, productId, buyerId, rating, comment ?? null],
    );
    return { id: Number(res.rows[0].id) };
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === '23505') {
      return {
        error: 'Você já avaliou este produto.',
        code: 'REVIEW_ALREADY_EXISTS',
        status: 409,
      };
    }
    throw e;
  }
}

export async function listAdminReviews(
  scope: StoreScope,
  page: number,
  limit: number,
  status?: string,
): Promise<{ reviews: AdminReview[]; total: number }> {
  const offset = (page - 1) * limit;
  const params: unknown[] = [scope.storeId];
  let statusFilter = '';
  if (status) {
    params.push(status);
    statusFilter = ` AND r.status = $${params.length}`;
  }

  const listSql = `
    SELECT r.id, r.product_id, p.name AS product_name, r.buyer_id, b.name AS buyer_name,
           r.rating, r.comment, r.status, r.created_at
    FROM product_reviews r
    INNER JOIN products p ON p.id = r.product_id AND p.store_id = r.store_id
    INNER JOIN buyers b ON b.id = r.buyer_id AND b.store_id = r.store_id
    WHERE r.store_id = $1${statusFilter}
    ORDER BY r.created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;
  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM product_reviews r
    WHERE r.store_id = $1${statusFilter}
  `;

  params.push(limit, offset);

  const [listRes, countRes] = await Promise.all([
    scope.pool.query(listSql, params),
    scope.pool.query(countSql, params.slice(0, status ? 2 : 1)),
  ]);

  const total = Number((countRes.rows[0] as { total: number } | undefined)?.total ?? 0);
  const reviews = listRes.rows.map((row) => ({
    id: Number(row.id),
    product_id: Number(row.product_id),
    product_name: String(row.product_name),
    buyer_id: Number(row.buyer_id),
    buyer_name: String(row.buyer_name),
    rating: Number(row.rating),
    comment: row.comment == null ? null : String(row.comment),
    status: String(row.status) as AdminReview['status'],
    created_at: toIso(row.created_at as Date | string),
  }));

  return { reviews, total };
}

export async function updateReviewStatus(
  scope: StoreScope,
  reviewId: number,
  status: 'approved' | 'rejected',
): Promise<AdminReview | null> {
  const res = await scope.pool.query(
    `UPDATE product_reviews
     SET status = $1, updated_at = NOW()
     WHERE id = $2 AND store_id = $3
     RETURNING id, product_id, buyer_id, rating, comment, status, created_at`,
    [status, reviewId, scope.storeId],
  );
  const row = res.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;

  const meta = await scope.pool.query(
    `SELECT p.name AS product_name, b.name AS buyer_name
     FROM products p, buyers b
     WHERE p.id = $1 AND p.store_id = $3 AND b.id = $2 AND b.store_id = $3`,
    [row.product_id, row.buyer_id, scope.storeId],
  );
  const metaRow = meta.rows[0] as { product_name: string; buyer_name: string } | undefined;

  return {
    id: Number(row.id),
    product_id: Number(row.product_id),
    product_name: metaRow?.product_name ?? '',
    buyer_id: Number(row.buyer_id),
    buyer_name: metaRow?.buyer_name ?? '',
    rating: Number(row.rating),
    comment: row.comment == null ? null : String(row.comment),
    status: String(row.status) as AdminReview['status'],
    created_at: toIso(row.created_at as Date | string),
  };
}
