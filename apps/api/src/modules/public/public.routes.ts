import type { FastifyInstance } from 'fastify';

import {
  getPaymentConfigHandler,
  getPublicCategoriesHandler,
  getPublicProductByIdHandler,
  getPublicStoreHandler,
  listPublicBannersHandler,
  listPublicProductsHandler,
} from './public.controller.js';

export async function publicRoutes(app: FastifyInstance): Promise<void> {
  app.get('/public/payment-config', getPaymentConfigHandler);
  app.get('/public/store', getPublicStoreHandler);
  app.get('/public/categories', getPublicCategoriesHandler);
  app.get('/public/products', listPublicProductsHandler);
  app.get('/public/banners', listPublicBannersHandler);
  app.get('/public/products/:id', getPublicProductByIdHandler);
}
