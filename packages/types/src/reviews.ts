import { z } from 'zod';

export const productRatingSummarySchema = z.object({
  average: z.number(),
  count: z.number().int().nonnegative(),
});

export type ProductRatingSummary = z.infer<typeof productRatingSummarySchema>;

export const publicProductReviewSchema = z.object({
  id: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  author_name: z.string(),
  created_at: z.string(),
});

export type PublicProductReview = z.infer<typeof publicProductReviewSchema>;

export const createProductReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().nullable(),
});

export type CreateProductReviewInput = z.infer<typeof createProductReviewSchema>;

export const updateReviewStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

export type UpdateReviewStatusInput = z.infer<typeof updateReviewStatusSchema>;

export const adminReviewSchema = z.object({
  id: z.number().int().positive(),
  product_id: z.number().int().positive(),
  product_name: z.string(),
  buyer_id: z.number().int().positive(),
  buyer_name: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  status: z.enum(['pending', 'approved', 'rejected']),
  created_at: z.string(),
});

export type AdminReview = z.infer<typeof adminReviewSchema>;

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
