import type { FastifyReply, FastifyRequest } from 'fastify';

import {
  getPublicCategoriesWithProducts,
  getPublicProductById,
  getPublicStore,
  listPublicBanners,
  listPublicProducts,
} from './public.service.js';

export async function getPaymentConfigHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  return reply.send({
    data: {
      stripe_public_key: process.env.STRIPE_PUBLIC_KEY ?? '',
      sumup_enabled: process.env.SUMUP_API_KEY ? true : false,
    },
  });
}

export async function getPublicStoreHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const data = await getPublicStore(request.db);
  return reply.send({ data });
}

export async function getPublicCategoriesHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const data = await getPublicCategoriesWithProducts(request.db);
  return reply.send({ data });
}

export async function listPublicProductsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const data = await listPublicProducts(request.drizzle);
  return reply.send({ data });
}

export async function listPublicBannersHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const data = await listPublicBanners(request.db);
  return reply.send({ data });
}

export async function getPublicProductByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  const data = await getPublicProductById(request.drizzle, id);
  if (!data) {
    return reply.code(404).send({ error: 'Produto não encontrado.', code: 'NOT_FOUND' });
  }

  return reply.send({ data });
}
