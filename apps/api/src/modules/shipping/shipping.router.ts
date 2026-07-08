import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../../plugins/auth-guard.js';
import { calculateShipping } from './shipping.controller.js';

export async function shippingRouter(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.post('/shipping/calculate', calculateShipping);
}
