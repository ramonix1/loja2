import { z } from 'zod';

export const RELATORIO_ABAS = [
  'vendas',
  'estoque',
  'entregas',
  'produtos',
  'financeiro',
  'clientes',
  'agendamentos',
] as const;

export type RelatorioAba = (typeof RELATORIO_ABAS)[number];

export const RELATORIO_CSV_TIPOS = [
  'vendas',
  'estoque',
  'entregas',
  'produtos',
  'financeiro',
  'clientes',
  'agendamentos',
] as const;

export type RelatorioCsvTipo = (typeof RELATORIO_CSV_TIPOS)[number];

export const FILTROS_ESTOQUE = ['todos', 'esgotado', 'baixo', 'ok', 'ilimitado'] as const;
export type FiltroEstoque = (typeof FILTROS_ESTOQUE)[number];

export const relatoriosQuerySchema = z.object({
  aba: z.enum(RELATORIO_ABAS).default('vendas'),
  inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  fim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  filtro_estoque: z.enum(FILTROS_ESTOQUE).default('todos'),
});

export type RelatoriosQuery = z.infer<typeof relatoriosQuerySchema>;

export const relatoriosCsvQuerySchema = z.object({
  inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  fim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const STATUS_LABEL: Record<string, string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  em_separacao: 'Em separação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};
