'use client';

import type { ReactNode } from 'react';

import { Card } from '../card';
import { cn } from '../cn';
import type { PanelSurface } from '../surface';

export interface KpiCellProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function KpiCell({ label, value, className }: KpiCellProps) {
  return (
    <div className={cn('min-w-0 flex-1 px-4 py-3 text-center first:pl-0 last:pr-0', className)}>
      <div className="text-2xl font-bold tracking-tight text-[var(--shell-text)] tabular-nums sm:text-3xl">
        {value}
      </div>
      <div className="mt-1 text-xs text-[var(--shell-text-muted)]">{label}</div>
    </div>
  );
}

export interface KpiStripProps {
  surface?: PanelSurface;
  primary: ReactNode;
  secondary?: ReactNode;
  className?: string;
  testId?: string;
}

/** Faixa KPI unificada — 1 ou 2 linhas de métricas com divisores. */
export function KpiStrip({ surface = 'platform', primary, secondary, className, testId }: KpiStripProps) {
  return (
    <Card
      surface={surface}
      className={cn('overflow-hidden p-0', className)}
      data-testid={testId ?? 'kpi-strip'}
    >
      <div className="flex flex-wrap divide-x divide-[var(--shell-border)]">{primary}</div>
      {secondary ? (
        <>
          <div className="border-t border-[var(--shell-border)]" />
          <div className="flex flex-wrap divide-x divide-[var(--shell-border)]">{secondary}</div>
        </>
      ) : null}
    </Card>
  );
}
