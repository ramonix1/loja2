export { produtoFieldsSchema } from '@lojao/types/produtos';

export type {
  ProdutoDetail,
  ProdutoFieldsInput,
  ProdutoImagem,
  ProdutoListItem,
} from '@lojao/types/produtos';

import { z } from 'zod';

export const estoqueBodySchema = z.object({
  estoque: z.union([z.number().int().min(0), z.null()]),
  observacao: z.string().max(500).optional(),
});
