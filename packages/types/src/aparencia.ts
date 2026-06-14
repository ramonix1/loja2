import { z } from 'zod';

export const aparenciaFieldsSchema = z.object({
  loja_nome: z.string().max(255).optional().default(''),
  loja_slogan: z.string().max(500).optional().default(''),
  loja_cor_primaria: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida. Use formato #RRGGBB.')
    .optional()
    .default('#2563eb'),
  loja_rodape: z.string().max(500).optional().default(''),
  loja_email: z
    .union([z.string().email('E-mail inválido.'), z.literal('')])
    .optional()
    .default(''),
  loja_whatsapp: z.string().max(30).optional().default(''),
});

export type AparenciaFields = z.infer<typeof aparenciaFieldsSchema>;

export interface AparenciaConfig {
  loja_nome: string;
  loja_slogan: string;
  loja_cor_primaria: string;
  loja_rodape: string;
  loja_email: string;
  loja_whatsapp: string;
  loja_logo: string;
  loja_favicon: string;
}
