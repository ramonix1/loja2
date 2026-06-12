import { z } from 'zod';

export const listCompradoresQuerySchema = z.object({
  busca: z.string().trim().optional(),
});

export type ListCompradoresQuery = z.infer<typeof listCompradoresQuerySchema>;

export interface CompradorListItem {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  cpf: string | null;
  cidade: string | null;
  estado: string | null;
  ativo: boolean;
  created_at: string;
  ultimo_acesso: string | null;
  total_pedidos: number;
  total_gasto: number;
}

export interface CompradoresTotais {
  total_compradores: number;
  ativos: number;
  novos_mes: number;
}

export interface CompradorDetail {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  cpf: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  ativo: boolean;
  created_at: string;
  ultimo_acesso: string | null;
}

export interface CompradorPedidoItem {
  nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export interface CompradorPedido {
  id: number;
  status: string;
  total: number;
  frete: number;
  created_at: string;
  qtd_itens: number;
  itens: CompradorPedidoItem[];
}

export interface CompradorAgendamento {
  id: number;
  pedido_id: number;
  data_evento: string;
  status: string;
  pedido_total: number;
  nome_entrega: string | null;
  pedido_status: string;
}

export interface CompradorResumo {
  total_pedidos: number;
  total_gasto: number;
  total_cancelado: number;
  ultimo_pedido: string | null;
}

export interface CompradorDetailResponse {
  comprador: CompradorDetail;
  pedidos: CompradorPedido[];
  agendamentos: CompradorAgendamento[];
  resumo: CompradorResumo;
}
