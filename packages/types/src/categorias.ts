import { z } from 'zod';

export const createCategoriaSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório.').max(255),
});

export const updateCategoriaSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório.').max(255),
  ordem: z.coerce.number().int().min(0).default(0),
  produtos_ids: z.array(z.coerce.number().int().positive()).default([]),
});

export type CreateCategoriaInput = z.infer<typeof createCategoriaSchema>;
export type UpdateCategoriaInput = z.infer<typeof updateCategoriaSchema>;

export interface CategoriaListItem {
  id: number;
  nome: string;
  ordem: number;
  ativo: boolean;
  total_produtos: number;
  created_at: string;
  updated_at: string;
}

export interface CategoriaDetail extends Omit<CategoriaListItem, 'total_produtos'> {
  produtos: Array<{ id: number; nome: string; categoria_id: number | null }>;
}
