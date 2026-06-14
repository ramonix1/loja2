import { z } from 'zod';

/** Query de listagem de pedidos: paginação + filtro opcional por status. */
export const pedidosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().min(1).optional(),
});

export type PedidosQuery = z.infer<typeof pedidosQuerySchema>;
