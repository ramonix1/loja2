import type { FastifyInstance } from 'fastify';

import { requireAdmin, requireAuth, requireBuyer } from '../../plugins/auth-guard.js';
import {
  getAdminReviews,
  getPublicProductReviews,
  patchReviewStatus,
  postProductReview,
} from './reviews.controller.js';

export async function reviewsRouter(app: FastifyInstance): Promise<void> {
  app.post('/products/:id/reviews', { preHandler: [requireAuth, requireBuyer] }, postProductReview);
}

export async function publicReviewsRouter(app: FastifyInstance): Promise<void> {
  app.get('/public/products/:id/reviews', getPublicProductReviews);
}

export async function adminReviewsRouter(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/reviews', getAdminReviews);
  app.patch('/admin/reviews/:id', patchReviewStatus);
}
