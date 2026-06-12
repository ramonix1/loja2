import { z } from 'zod';

/** Campos de texto do banner (imagem vem via multipart). */
export const bannerFieldsSchema = z.object({
  titulo: z.string().trim().min(1, 'Título é obrigatório.').max(255),
  subtitulo: z.string().trim().max(500).optional().nullable(),
  cta_texto: z.string().trim().max(100).default('Ver oferta'),
  cta_url: z.string().trim().max(500).optional().nullable(),
  produto_id: z.coerce.number().int().positive().optional().nullable(),
  ativo: z.coerce.boolean().default(true),
  ordem: z.coerce.number().int().min(0).default(0),
});

export type BannerFieldsInput = z.infer<typeof bannerFieldsSchema>;

export interface BannerListItem {
  id: number;
  titulo: string;
  subtitulo: string | null;
  imagem: string;
  cta_texto: string;
  cta_url: string | null;
  produto_id: number | null;
  produto_nome: string | null;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface BannerDetail extends Omit<BannerListItem, 'produto_nome'> {}

export interface ProdutoOption {
  id: number;
  nome: string;
}
