import { z } from 'zod';

export const calculateSchema = z.object({
  cep_destino: z.string().min(8),
  subtotal: z.number().min(0).optional(),
});
