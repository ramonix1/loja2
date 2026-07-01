import { z } from 'zod';

export const addItemSchema = z.object({
  produto_id: z.number().int().positive(),
  quantidade: z.number().int().positive().optional(),
});

export const updateItemSchema = z.object({
  quantidade: z.number().int().min(0),
});
