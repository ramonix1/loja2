import { z } from 'zod';

/** Converte "R$ 10,50" ou "10.50" em número. */
export function parseValorBRL(input: unknown): number {
  if (typeof input === 'number' && !Number.isNaN(input)) return input;
  const raw = String(input ?? '0')
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();
  const n = parseFloat(raw);
  return Number.isNaN(n) ? 0 : n;
}

const estoqueSchema = z
  .union([z.coerce.number().int().min(0), z.literal(''), z.null()])
  .optional()
  .transform((v) => (v === '' || v === null || v === undefined ? null : v));

export const produtoFieldsSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório.').max(255),
  subtitulo: z.string().trim().max(255).optional().nullable(),
  valor: z.preprocess(parseValorBRL, z.number().min(0, 'Valor inválido.')),
  descricao: z.string().trim().max(5000).optional().nullable(),
  estoque: estoqueSchema,
  categoria_id: z.coerce.number().int().positive().optional().nullable(),
});

export type ProdutoFieldsInput = z.infer<typeof produtoFieldsSchema>;

export interface ProdutoImagem {
  id: number;
  url: string;
}

export interface ProdutoListItem {
  id: number;
  nome: string;
  subtitulo: string | null;
  valor: number;
  descricao: string | null;
  estoque: number | null;
  categoria_id: number | null;
  primeira_imagem: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProdutoDetail extends Omit<ProdutoListItem, 'primeira_imagem'> {
  imagens: ProdutoImagem[];
}
