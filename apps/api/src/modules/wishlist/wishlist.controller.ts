import type { FastifyReply, FastifyRequest } from 'fastify';

import { requireStoreScope } from '../../lib/store-scope.js';
import {
  addWishlistItem,
  countWishlistItems,
  listWishlistProductIds,
  listWishlistProducts,
  removeWishlistItem,
} from './wishlist.service.js';

export async function getWishlist(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const products = await listWishlistProducts(requireStoreScope(request), request.session.usuarioId!);
  return reply.send({ data: { products } });
}

export async function getWishlistIds(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const product_ids = await listWishlistProductIds(
    requireStoreScope(request),
    request.session.usuarioId!,
  );
  return reply.send({ data: { product_ids } });
}

export async function getWishlistCount(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const count = await countWishlistItems(requireStoreScope(request), request.session.usuarioId!);
  return reply.send({ data: { count } });
}

export async function addToWishlist(request: FastifyRequest, reply: FastifyReply): Promise<void> {
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
}

export async function removeFromWishlist(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
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
}
