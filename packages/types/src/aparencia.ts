import { z } from 'zod';

import { storeThemeSchema } from './store-theme.js';

/** Cor primária padrão Ata Commerce — manual PDF (`--ata-azul-comercio`). */
export const DEFAULT_LOJA_COR_PRIMARIA = '#0D5FE0';

export const aparenciaFieldsSchema = z.object({
  loja_nome: z.string().max(255).optional().default(''),
  loja_slogan: z.string().max(500).optional().default(''),
  loja_cor_primaria: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida. Use formato #RRGGBB.')
    .optional()
    .default(DEFAULT_LOJA_COR_PRIMARIA),
  loja_tema: storeThemeSchema.optional().default('escuro'),
  loja_rodape: z.string().max(500).optional().default(''),
  loja_email: z
    .union([z.string().email('E-mail inválido.'), z.literal('')])
    .optional()
    .default(''),
  loja_whatsapp: z.string().max(30).optional().default(''),
});

export type AparenciaFields = z.infer<typeof aparenciaFieldsSchema>;

import type { StoreTheme } from './store-theme.js';

export interface AparenciaConfig {
  loja_nome: string;
  loja_slogan: string;
  loja_cor_primaria: string;
  loja_tema: StoreTheme;
  loja_rodape: string;
  loja_email: string;
  loja_whatsapp: string;
  loja_logo: string;
  loja_favicon: string;
}
