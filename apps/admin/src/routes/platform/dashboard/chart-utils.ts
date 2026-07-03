import type { DashboardPeriodo } from '@lojao/types/dashboard';

export const PERIOD_LABELS: Record<DashboardPeriodo, string> = {
  '7d': '7 dias',
  '30d': '30 dias',
  '90d': '90 dias',
};

export function formatChartDate(isoDate: string): string {
  const [, m, d] = isoDate.slice(0, 10).split('-');
  return `${d}/${m}`;
}

export function healthLabel(health: string): string {
  if (health === 'healthy') return 'Saudável';
  if (health === 'attention') return 'Atenção';
  if (health === 'suspended') return 'Suspensa';
  return health;
}

export function billingStatusLabel(status: string): string {
  if (status === 'sem_billing') return 'Sem billing';
  if (status === 'trialing') return 'Trial';
  if (status === 'active') return 'Ativo';
  if (status === 'past_due') return 'Inadimplente';
  if (status === 'cancelled') return 'Cancelado';
  if (status === 'unpaid') return 'Não pago';
  return status.replace(/_/g, ' ');
}

export function planLabel(plano: string): string {
  if (plano === 'starter') return 'Starter';
  if (plano === 'professional') return 'Professional';
  if (plano === 'enterprise') return 'Enterprise';
  return plano;
}

export { usePrefersReducedMotion } from '../../admin/dashboard/chart-utils';
