import { z } from 'zod';

import { publicProductSchema } from './public-store.js';

export const wishlistIdsResponseSchema = z.object({
  product_ids: z.array(z.number().int().positive()),
});

export type WishlistIdsResponse = z.infer<typeof wishlistIdsResponseSchema>;

export const wishlistCountResponseSchema = z.object({
  count: z.number().int().nonnegative(),
});

export type WishlistCountResponse = z.infer<typeof wishlistCountResponseSchema>;

export const wishlistListResponseSchema = z.object({
  products: z.array(publicProductSchema),
});

export type WishlistListResponse = z.infer<typeof wishlistListResponseSchema>;
