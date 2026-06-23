import { useMemo } from 'react';

import type { UiSurface } from './surface';
import { resolveSurface } from './surface';

function readCssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function prefix(surface: UiSurface): string {
  return surface === 'admin' ? '--admin' : '--platform';
}

export function getChartAxisStyle(surface: UiSurface = 'admin') {
  const p = prefix(surface);
  return {
    stroke: readCssVar(`${p}-chart-axis`, surface === 'admin' ? '#5cb1fe' : '#173404'),
    fontSize: 11,
    fill: readCssVar(`${p}-chart-axis`, surface === 'admin' ? '#5cb1fe' : '#173404'),
  };
}

export function getChartGridProps(surface: UiSurface = 'admin') {
  const p = prefix(surface);
  return {
    stroke: readCssVar(`${p}-chart-grid`, surface === 'admin' ? '#a3d7fe' : '#d3d1c7'),
    strokeDasharray: '3 3',
  };
}

export function getChartTooltipStyle(surface: UiSurface = 'admin') {
  const p = prefix(surface);
  const bg = readCssVar(`${p}-surface`, surface === 'admin' ? '#012a7e' : '#173404');
  const border = readCssVar(`${p}-border`, surface === 'admin' ? '#a3d7fe' : '#639922');
  const text = readCssVar(`${p}-text`, '#ffffff');
  const muted = readCssVar(`${p}-text-muted`, text);

  return {
    contentStyle: {
      backgroundColor: bg,
      border: `1px solid ${border}`,
      borderRadius: '8px',
      color: text,
      fontSize: '12px',
    },
    labelStyle: { color: muted, marginBottom: 4 },
    itemStyle: { color: text },
  };
}

/** Paleta de status para gráficos — cores Ata / semânticas. */
export const STATUS_CHART_COLORS: Record<string, string> = {
  pago: 'var(--admin-success, var(--ata-verde-broto))',
  aguardando_pagamento: 'var(--admin-warning, #e6a817)',
  em_separacao: 'var(--ata-azul-vivido)',
  enviado: 'var(--ata-azul-ceu)',
  entregue: 'var(--ata-verde-mata)',
  cancelado: 'var(--admin-error, #e05252)',
};

export const PAYMENT_CHART_COLORS = [
  'var(--ata-azul-comercio)',
  'var(--ata-azul-vivido)',
  'var(--ata-azul-ceu)',
  'var(--admin-warning, #e6a817)',
  'var(--ata-cinza-pedra)',
];

/** Re-renderiza quando o tema muda (toggle escuro/claro). */
export function useChartTheme(surface: UiSurface = 'admin', theme?: 'commerce' | 'platform') {
  const resolved = resolveSurface(surface, theme);

  return useMemo(
    () => ({
      axis: getChartAxisStyle(resolved),
      grid: getChartGridProps(resolved),
      tooltip: getChartTooltipStyle(resolved),
      surface: resolved,
    }),
    [resolved],
  );
}
