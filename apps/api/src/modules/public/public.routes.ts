import type { FastifyInstance } from 'fastify';

import {
  getPublicCategoriesWithProducts,
  getPublicProductById,
  getPublicStore,
  listPublicBanners,
  listPublicProducts,
} from './public.service.js';

export async function publicRoutes(app: FastifyInstance): Promise<void> {
  app.get('/public/payment-config', async (_request, reply) => {
    return reply.send({
      data: {
        stripe_public_key: process.env.STRIPE_PUBLIC_KEY ?? '',
        sumup_enabled: process.env.SUMUP_API_KEY ? true : false,
      },
    });
  });

  app.get('/public/store', async (request, reply) => {
    const data = await getPublicStore(request.db);
    return reply.send({ data });
  });

  app.get('/public/categories', async (request, reply) => {
    const data = await getPublicCategoriesWithProducts(request.db);
    return reply.send({ data });
  });

  app.get('/public/products', async (request, reply) => {
    const data = await listPublicProducts(request.drizzle);
    return reply.send({ data });
  });

  app.get('/public/banners', async (request, reply) => {
    const data = await listPublicBanners(request.db);
    return reply.send({ data });
  });

  app.get('/public/products/:id', async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id) || id < 1) {
      return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
    }

    const data = await getPublicProductById(request.drizzle, id);
    if (!data) {
      return reply.code(404).send({ error: 'Produto não encontrado.', code: 'NOT_FOUND' });
    }

    return reply.send({ data });
  });
}
