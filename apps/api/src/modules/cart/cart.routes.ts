import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../../plugins/auth-guard.js';
import {
  addCartItemHandler,
  getCartCountHandler,
  getCartHandler,
  removeCartItemHandler,
  updateCartItemHandler,
} from './cart.controller.js';

export async function cartRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/cart', getCartHandler);
  app.get('/cart/count', getCartCountHandler);
  app.post('/cart/items', addCartItemHandler);
  app.patch('/cart/items/:id', updateCartItemHandler);
  app.delete('/cart/items/:id', removeCartItemHandler);
}
