import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../../plugins/auth-guard.js';
import { calculateShippingHandler } from './shipping.controller.js';

export async function shippingRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.post('/shipping/calculate', calculateShippingHandler);
}
