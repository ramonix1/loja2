import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../../plugins/auth-guard.js';
import {
  getCheckoutPreviewHandler,
  getCheckoutResultHandler,
  processCheckoutHandler,
} from './checkout.controller.js';

export async function checkoutRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/checkout', getCheckoutPreviewHandler);
  app.post('/checkout', processCheckoutHandler);
  app.get('/checkout/:id/result', getCheckoutResultHandler);
}
