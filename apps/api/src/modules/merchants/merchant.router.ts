import type { FastifyInstance } from 'fastify';

import { requireMerchantOwner } from '../../plugins/auth-guard.js';
import {
  checkMerchantSlug,
  postCreateStore,
  postMerchantSignup,
} from './merchant.controller.js';

export async function merchantRouter(app: FastifyInstance): Promise<void> {
  app.get('/public/merchant-signup/check-slug', checkMerchantSlug);
  app.post('/public/merchant-signup', postMerchantSignup);
  app.post('/merchants/:merchantId/stores', { preHandler: requireMerchantOwner }, postCreateStore);
}
