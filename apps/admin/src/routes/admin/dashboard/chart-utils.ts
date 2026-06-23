import type { DashboardPeriodo } from '@lojao/types/dashboard';
import { useSyncExternalStore } from 'react';

export {
  getChartAxisStyle,
  getChartGridProps,
  getChartTooltipStyle,
  PAYMENT_CHART_COLORS as PAYMENT_COLORS,
  STATUS_CHART_COLORS,
  useChartTheme,
} from '@lojao/ui';

export const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const BRL_COMPACT = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatChartDate(isoDate: string): string {
  const [, m, d] = isoDate.slice(0, 10).split('-');
  return `${d}/${m}`;
}

export function statusLabel(status: string): string {
  return status.replace(/_/g, ' ');
}

export function metodoLabel(metodo: string): string {
  if (metodo === 'pix') return 'PIX';
  if (metodo === 'boleto') return 'Boleto';
  if (metodo === 'cartao') return 'Cartão';
  if (metodo === 'sumup') return 'SumUp';
  if (metodo === 'teste') return 'Teste';
  if (metodo === 'N/A') return 'N/A';
  return metodo;
}

function subscribeReducedMotion(onChange: () => void): () => void {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );
}

export const PERIOD_LABELS: Record<DashboardPeriodo, string> = {
  '7d': '7 dias',
  '30d': '30 dias',
  '90d': '90 dias',
};
