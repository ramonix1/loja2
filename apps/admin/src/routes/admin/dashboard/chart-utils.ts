import type { DashboardPeriodo } from '@lojao/types/dashboard';
import { useSyncExternalStore } from 'react';

export const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const BRL_COMPACT = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const STATUS_CHART_COLORS: Record<string, string> = {
  pago: '#4ade80',
  aguardando_pagamento: '#facc15',
  em_separacao: '#60a5fa',
  enviado: '#818cf8',
  entregue: '#34d399',
  cancelado: '#f87171',
};

export const PAYMENT_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#64748b'];

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

export const CHART_AXIS = { stroke: '#6b7280', fontSize: 11 };
export const CHART_GRID = { stroke: '#374151', strokeDasharray: '3 3' };

export const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#111827',
    border: '1px solid #374151',
    borderRadius: '8px',
    color: '#f3f4f6',
    fontSize: '12px',
  },
  labelStyle: { color: '#d1d5db', marginBottom: 4 },
  itemStyle: { color: '#f9fafb' },
};
