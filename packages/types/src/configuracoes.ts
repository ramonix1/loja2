import { z } from 'zod';

export const updateConfiguracoesSchema = z.object({
  controla_estoque: z.boolean().default(false),
  reservar_estoque_carrinho: z.boolean().default(false),
  modulo_agenda: z.boolean().default(false),
  habilitar_sumup: z.boolean().default(false),
  frete_cep_origem: z.string().max(9).default(''),
  frete_fixo: z.coerce.number().min(0).default(0),
  frete_gratis_acima: z.coerce.number().min(0).default(0),
  melhor_envio_token: z.string().max(2000).default(''),
  melhor_envio_sandbox: z.boolean().default(true),
  frete_peso_padrao: z.coerce.number().int().min(1).default(300),
  frete_altura: z.coerce.number().min(0.1).default(4),
  frete_largura: z.coerce.number().min(0.1).default(12),
  frete_comprimento: z.coerce.number().min(0.1).default(17),
});

export type UpdateConfiguracoesInput = z.infer<typeof updateConfiguracoesSchema>;

export interface ConfiguracoesConfig {
  controla_estoque: boolean;
  reservar_estoque_carrinho: boolean;
  modulo_agenda: boolean;
  habilitar_sumup: boolean;
  frete_cep_origem: string;
  frete_fixo: number;
  frete_gratis_acima: number;
  melhor_envio_token: string;
  melhor_envio_sandbox: boolean;
  frete_peso_padrao: number;
  frete_altura: number;
  frete_largura: number;
  frete_comprimento: number;
}
