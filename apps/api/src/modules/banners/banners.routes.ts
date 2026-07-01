import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../plugins/auth-guard.js';
import {
  createBannerHandler,
  deleteBannerHandler,
  getBannerHandler,
  listBannerFormOptionsHandler,
  listBannersHandler,
  toggleBannerAtivoHandler,
  updateBannerHandler,
} from './banners.controller.js';

export async function bannersRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/banners', listBannersHandler);
  app.get('/admin/banners/form-options', listBannerFormOptionsHandler);
  app.get('/admin/banners/:id', getBannerHandler);
  app.post('/admin/banners', createBannerHandler);
  app.put('/admin/banners/:id', updateBannerHandler);
  app.delete('/admin/banners/:id', deleteBannerHandler);
  app.patch('/admin/banners/:id/toggle-ativo', toggleBannerAtivoHandler);
}
