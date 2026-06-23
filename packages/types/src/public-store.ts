import { z } from 'zod';

import { storeThemeSchema } from './store-theme.js';

export const publicProductSchema = z.object({
  id: z.number().int().positive(),
  nome: z.string(),
  subtitulo: z.string().nullable(),
  valor: z.number(),
  estoque: z.number().int().nullable(),
  categoria_id: z.number().int().nullable(),
  primeira_imagem: z.string().nullable(),
});

export type PublicProduct = z.infer<typeof publicProductSchema>;

export const publicCategorySchema = z.object({
  id: z.number().int().positive(),
  nome: z.string(),
  ordem: z.number().int(),
  produtos: z.array(publicProductSchema),
});

export type PublicCategory = z.infer<typeof publicCategorySchema>;

export const publicProductDetailSchema = publicProductSchema.extend({
  descricao: z.string().nullable(),
  imagens: z.array(
    z.object({
      id: z.number().int(),
      url: z.string(),
    }),
  ),
});

export type PublicProductDetail = z.infer<typeof publicProductDetailSchema>;

export const publicStoreSchema = z.object({
  loja: z.object({
    nome: z.string(),
    cor_primaria: z.string(),
    tema: storeThemeSchema.default('escuro'),
    logo: z.string(),
    slogan: z.string(),
    favicon: z.string().optional(),
  }),
  categorias: z.array(publicCategorySchema),
  produtos_sem_categoria: z.array(publicProductSchema),
  controla_estoque: z.boolean(),
});

export type PublicStoreData = z.infer<typeof publicStoreSchema>;

export const publicBannerSchema = z.object({
  id: z.number().int(),
  titulo: z.string(),
  subtitulo: z.string().nullable(),
  imagem: z.string(),
  cta_texto: z.string(),
  cta_url: z.string().nullable(),
  produto_id: z.number().int().nullable(),
});

export type PublicBanner = z.infer<typeof publicBannerSchema>;
