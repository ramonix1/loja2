import { z } from 'zod';

export const checkoutSchema = z.object({
  nome_entrega: z.string().min(3),
  email_entrega: z.string().email(),
  telefone_entrega: z.string().optional(),
  cpf_entrega: z.string().optional(),
  cep: z.string().min(8),
  logradouro: z.string().min(3),
  numero: z.string().min(1),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().min(2),
  estado: z.string().length(2),
  metodo_pagamento: z.enum(['pix', 'boleto', 'cartao', 'sumup_online', 'teste']),
  data_evento: z.string().optional(),
  stripe_payment_method_id: z.string().optional(),
  frete_valor: z.number().min(0).optional(),
  frete_servico: z.string().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export type CheckoutResult =
  | {
      ok: true;
      pedido_id: number;
      status: string;
      redirect_url?: string;
    }
  | { ok: false; error: string; code: string; status: number };
