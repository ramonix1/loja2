import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../../plugins/auth-guard.js';
import {
  getCheckoutPreviewHandler,
  getCheckoutResultHandler,
  postCheckout,
} from './checkout.controller.js';

export async function checkoutRouter(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/checkout', getCheckoutPreviewHandler);
  app.post('/checkout', postCheckout);
  app.get('/checkout/:id/result', getCheckoutResultHandler);
}
