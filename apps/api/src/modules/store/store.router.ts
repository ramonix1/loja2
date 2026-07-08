import type { FastifyInstance } from 'fastify';

import { getStoreConfig } from './store.controller.js';

export async function storeRouter(app: FastifyInstance): Promise<void> {
  app.get('/store/config', getStoreConfig);
}
