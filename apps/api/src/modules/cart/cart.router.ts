import type { FastifyInstance } from 'fastify';

import { requireAuth, requireBuyer } from '../../plugins/auth-guard.js';
import { addItem, getCart, getCartCount, removeItem, updateItem } from './cart.controller.js';

export async function cartRouter(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requireBuyer);

  app.get('/cart', getCart);
  app.get('/cart/count', getCartCount);
  app.post('/cart/items', addItem);
  app.patch('/cart/items/:id', updateItem);
  app.delete('/cart/items/:id', removeItem);
}
