import type { FastifyInstance } from 'fastify';

import { requireAuth, requireBuyer } from '../../plugins/auth-guard.js';
import {
  addToWishlist,
  getWishlist,
  getWishlistCount,
  getWishlistIds,
  removeFromWishlist,
} from './wishlist.controller.js';

export async function wishlistRouter(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requireBuyer);

  app.get('/wishlist', getWishlist);
  app.get('/wishlist/ids', getWishlistIds);
  app.get('/wishlist/count', getWishlistCount);
  app.post('/wishlist/:productId', addToWishlist);
  app.delete('/wishlist/:productId', removeFromWishlist);
}
