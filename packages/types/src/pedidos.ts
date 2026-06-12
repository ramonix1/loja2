import { z } from 'zod';

export const PEDIDO_STATUS = [
  'aguardando_pagamento',
  'pago',
  'em_separacao',
  'enviado',
  'entregue',
  'cancelado',
] as const;

export type PedidoStatus = (typeof PEDIDO_STATUS)[number];

export const updatePedidoStatusSchema = z.object({
  status: z.enum(PEDIDO_STATUS),
  codigo_rastreio: z.string().trim().max(100).optional().nullable(),
});

export type UpdatePedidoStatusInput = z.infer<typeof updatePedidoStatusSchema>;

export type PedidoItem = {
  id: number;
  produto_id: number | null;
  nome_produto: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
};

export type PedidoPagamento = {
  id: number;
  mp_payment_id: string | null;
  status: string;
  status_mp: string | null;
  metodo: string | null;
};

export type PedidoDetalhe = {
  id: number;
  status: PedidoStatus;
  subtotal: number;
  frete: number;
  total: number;
  metodo_pagamento: string | null;
  codigo_rastreio: string | null;
  created_at: string;
  usuario_nome: string;
  usuario_email: string;
  nome_entrega: string | null;
  email_entrega: string | null;
  telefone_entrega: string | null;
  cpf_entrega: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  itens: PedidoItem[];
  pagamento: PedidoPagamento | null;
};

export type PedidoRecente = {
  id: number;
  status: string;
  total: number;
  created_at: string;
  metodo_pagamento: string | null;
  cliente_nome: string;
};
