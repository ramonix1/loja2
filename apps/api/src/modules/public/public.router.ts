import type { FastifyInstance } from 'fastify';

import {
  getPaymentConfig,
  getPublicBanners,
  getPublicCategories,
  getPublicProduct,
  getPublicProducts,
  getPublicStoreHandler,
} from './public.controller.js';

export async function publicRouter(app: FastifyInstance): Promise<void> {
  app.get('/public/payment-config', getPaymentConfig);
  app.get('/public/store', getPublicStoreHandler);
  app.get('/public/categories', getPublicCategories);
  app.get('/public/products', getPublicProducts);
  app.get('/public/banners', getPublicBanners);
  app.get('/public/products/:id', getPublicProduct);
}
