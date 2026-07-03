'use client';

import type { ReactNode } from 'react';

import { cn } from '../cn';

export interface PageToolbarProps {
  children: ReactNode;
  className?: string;
}

/** Toolbar de listagem — busca, filtros, toggle de view, CTA. */
export function PageToolbar({ children, className }: PageToolbarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageToolbarStart({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center', className)}>
      {children}
    </div>
  );
}

export function PageToolbarEnd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex shrink-0 flex-wrap items-center gap-2', className)}>{children}</div>
  );
}
