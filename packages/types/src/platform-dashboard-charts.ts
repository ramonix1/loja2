import { z } from 'zod';

import { DASHBOARD_PERIODOS, type DashboardPeriodo } from './dashboard.js';

export { DASHBOARD_PERIODOS, type DashboardPeriodo };

export const platformDashboardChartsQuerySchema = z.object({
  periodo: z.enum(DASHBOARD_PERIODOS).default('30d'),
});

export type PlatformDashboardChartsQuery = z.infer<typeof platformDashboardChartsQuerySchema>;

export interface PlatformLojasPorDia {
  dia: string;
  lojas: number;
}

export interface PlatformSaudeLojas {
  health: 'healthy' | 'attention' | 'suspended';
  total: number;
}

export interface PlatformBillingStatus {
  status: string;
  total: number;
}

export interface PlatformLojasPorPlano {
  plano: string;
  total: number;
}

export interface PlatformDashboardChartsData {
  periodo: DashboardPeriodo;
  lojas_por_dia: PlatformLojasPorDia[];
  saude_lojas: PlatformSaudeLojas[];
  billing_merchants: PlatformBillingStatus[];
  lojas_por_plano: PlatformLojasPorPlano[];
}
