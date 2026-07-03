import {
  createProductReviewSchema,
  listReviewsQuerySchema,
  updateReviewStatusSchema,
} from '@lojao/types/reviews';
import type { FastifyInstance } from 'fastify';

import { requireStoreScope } from '../../lib/store-scope.js';
import { requireAdmin, requireAuth, requireBuyer } from '../../plugins/auth-guard.js';
import {
  createProductReview,
  listAdminReviews,
  listPublicProductReviews,
  updateReviewStatus,
} from './reviews.service.js';

export async function reviewsRoutes(app: FastifyInstance): Promise<void> {
  app.post('/products/:id/reviews', { preHandler: [requireAuth, requireBuyer] }, async (request, reply) => {
    const productId = Number((request.params as { id: string }).id);
    if (!Number.isInteger(productId) || productId < 1) {
      return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
    }

    const parsed = createProductReviewSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Dados inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await createProductReview(
      requireStoreScope(request),
      request.session.usuarioId!,
      productId,
      parsed.data.rating,
      parsed.data.comment,
    );

    if ('error' in result) {
      return reply.code(result.status).send({ error: result.error, code: result.code });
    }

    return reply.send({ data: result });
  });
}

export async function publicReviewsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/public/products/:id/reviews', async (request, reply) => {
    const productId = Number((request.params as { id: string }).id);
    if (!Number.isInteger(productId) || productId < 1) {
      return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
    }

    const parsed = listReviewsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Parâmetros inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { reviews, total } = await listPublicProductReviews(
      requireStoreScope(request),
      productId,
      parsed.data.page,
      parsed.data.limit,
    );

    return reply.send({
      data: reviews,
      meta: {
        page: parsed.data.page,
        perPage: parsed.data.limit,
        total,
      },
    });
  });
}

export async function adminReviewsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/reviews', async (request, reply) => {
    const parsed = listReviewsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Parâmetros inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { reviews, total } = await listAdminReviews(
      requireStoreScope(request),
      parsed.data.page,
      parsed.data.limit,
      parsed.data.status,
    );

    return reply.send({
      data: reviews,
      meta: {
        page: parsed.data.page,
        perPage: parsed.data.limit,
        total,
      },
    });
  });

  app.patch('/admin/reviews/:id', async (request, reply) => {
    const reviewId = Number((request.params as { id: string }).id);
    if (!Number.isInteger(reviewId) || reviewId < 1) {
      return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
    }

    const parsed = updateReviewStatusSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Dados inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const data = await updateReviewStatus(
      requireStoreScope(request),
      reviewId,
      parsed.data.status,
    );

    if (!data) {
      return reply.code(404).send({ error: 'Avaliação não encontrada.', code: 'NOT_FOUND' });
    }

    return reply.send({ data });
  });
}
