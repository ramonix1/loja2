import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import {
  createBannerHandler,
  deleteBannerHandler,
  getBannerById,
  getBanners,
  getFormOptions,
  toggleAtivoBanner,
  updateBannerHandler,
} from './banners.controller.js';

export async function bannersRouter(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/banners', getBanners);
  app.get('/admin/banners/form-options', getFormOptions);
  app.get('/admin/banners/:id', getBannerById);
  app.post('/admin/banners', createBannerHandler);
  app.put('/admin/banners/:id', updateBannerHandler);
  app.delete('/admin/banners/:id', deleteBannerHandler);
  app.patch('/admin/banners/:id/toggle-ativo', toggleAtivoBanner);
}
