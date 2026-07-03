import type { FastifyInstance } from 'fastify';

import { requireStoreScope } from '../../lib/store-scope.js';
import { requireAuth, requireBuyer } from '../../plugins/auth-guard.js';
import {
  addWishlistItem,
  countWishlistItems,
  listWishlistProductIds,
  listWishlistProducts,
  removeWishlistItem,
} from './wishlist.service.js';

export async function wishlistRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requireBuyer);

  app.get('/wishlist', async (request, reply) => {
    const products = await listWishlistProducts(requireStoreScope(request), request.session.usuarioId!);
    return reply.send({ data: { products } });
  });

  app.get('/wishlist/ids', async (request, reply) => {
    const product_ids = await listWishlistProductIds(
      requireStoreScope(request),
      request.session.usuarioId!,
    );
    return reply.send({ data: { product_ids } });
  });

  app.get('/wishlist/count', async (request, reply) => {
    const count = await countWishlistItems(requireStoreScope(request), request.session.usuarioId!);
    return reply.send({ data: { count } });
  });

  app.post('/wishlist/:productId', async (request, reply) => {
    const productId = Number((request.params as { productId: string }).productId);
    if (!Number.isInteger(productId) || productId < 1) {
      return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
    }

    const result = await addWishlistItem(
      requireStoreScope(request),
      request.session.usuarioId!,
      productId,
    );

    if ('error' in result) {
      return reply.code(result.status).send({ error: result.error, code: result.code });
    }

    return reply.send({ data: result });
  });

  app.delete('/wishlist/:productId', async (request, reply) => {
    const productId = Number((request.params as { productId: string }).productId);
    if (!Number.isInteger(productId) || productId < 1) {
      return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
    }

    const removed = await removeWishlistItem(
      requireStoreScope(request),
      request.session.usuarioId!,
      productId,
    );

    if (!removed) {
      return reply.code(404).send({ error: 'Item não encontrado na wishlist.', code: 'NOT_FOUND' });
    }

    return reply.send({ data: { removed: true } });
  });
}
