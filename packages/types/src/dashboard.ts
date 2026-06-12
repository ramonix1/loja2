import { z } from 'zod';

export const DASHBOARD_PERIODOS = ['7d', '30d', '90d'] as const;
export type DashboardPeriodo = (typeof DASHBOARD_PERIODOS)[number];

export const dashboardChartsQuerySchema = z.object({
  periodo: z.enum(DASHBOARD_PERIODOS).default('30d'),
});

export type DashboardChartsQuery = z.infer<typeof dashboardChartsQuerySchema>;

export interface ReceitaPorDia {
  dia: string;
  receita: number;
  pedidos: number;
}

export interface PedidosPorStatus {
  status: string;
  total: number;
}

export interface ReceitaPorMetodo {
  metodo: string;
  receita: number;
  pedidos: number;
}

export interface TopProdutoChart {
  nome: string;
  quantidade: number;
  receita: number;
}

export interface DashboardChartsData {
  periodo: DashboardPeriodo;
  receita_por_dia: ReceitaPorDia[];
  pedidos_por_status: PedidosPorStatus[];
  receita_por_metodo: ReceitaPorMetodo[];
  top_produtos: TopProdutoChart[];
}
