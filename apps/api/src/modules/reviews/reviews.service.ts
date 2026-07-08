import type { AdminReview, ProductRatingSummary, PublicProductReview } from '@lojao/types/reviews';

import type { StoreScope } from '../../lib/store-scope.js';
import {
  findAdminReviews,
  findBuyerEligibility,
  findPublicReviews,
  findRatingSummariesByProductIds,
  insertProductReview,
  productExistsForReview,
  updateReviewStatusRecord,
} from './reviews.repository.js';

export async function getRatingSummariesByProductIds(
  scope: StoreScope,
  productIds: number[],
): Promise<Map<number, ProductRatingSummary>> {
  return findRatingSummariesByProductIds(scope, productIds);
}

export async function getRatingSummaryForProduct(
  scope: StoreScope,
  productId: number,
): Promise<ProductRatingSummary | null> {
  const map = await findRatingSummariesByProductIds(scope, [productId]);
  return map.get(productId) ?? null;
}

export async function buyerCanReviewProduct(
  scope: StoreScope,
  buyerId: number,
  productId: number,
): Promise<boolean> {
  return findBuyerEligibility(scope, buyerId, productId);
}

export async function listPublicProductReviews(
  scope: StoreScope,
  productId: number,
  page: number,
  limit: number,
): Promise<{ reviews: PublicProductReview[]; total: number }> {
  const offset = (page - 1) * limit;
  return findPublicReviews(scope, productId, limit, offset);
}

export async function createProductReview(
  scope: StoreScope,
  buyerId: number,
  productId: number,
  rating: number,
  comment: string | null | undefined,
): Promise<{ id: number } | { error: string; code: string; status: number }> {
  const productExists = await productExistsForReview(scope, productId);
  if (!productExists) {
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

  const result = await insertProductReview(scope, productId, buyerId, rating, comment);
  if ('code' in result && result.code === '23505') {
    return {
      error: 'Você já avaliou este produto.',
      code: 'REVIEW_ALREADY_EXISTS',
      status: 409,
    };
  }

  return result as { id: number };
}

export async function listAdminReviews(
  scope: StoreScope,
  page: number,
  limit: number,
  status?: string,
): Promise<{ reviews: AdminReview[]; total: number }> {
  const offset = (page - 1) * limit;
  return findAdminReviews(scope, limit, offset, status);
}

export async function updateReviewStatus(
  scope: StoreScope,
  reviewId: number,
  status: 'approved' | 'rejected',
): Promise<AdminReview | null> {
  return updateReviewStatusRecord(scope, reviewId, status);
}
