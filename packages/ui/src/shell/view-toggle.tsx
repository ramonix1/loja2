'use client';

import { LayoutGrid, List } from 'lucide-react';

import { cn } from '../cn';
import type { PanelSurface } from '../surface';

export type ViewMode = 'grid' | 'list';

export interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  surface?: PanelSurface;
  className?: string;
  testId?: string;
}

export function ViewToggle({ value, onChange, className, testId }: ViewToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex rounded-lg border border-[var(--shell-border)] bg-[var(--shell-surface)] p-0.5',
        className,
      )}
      role="group"
      aria-label="Alternar visualização"
      data-testid={testId ?? 'view-toggle'}
    >
      <button
        type="button"
        className={cn(
          'inline-flex size-10 items-center justify-center rounded-md transition',
          value === 'grid'
            ? 'bg-[var(--shell-sidebar-active-bg)] text-[var(--shell-text)]'
            : 'text-[var(--shell-text-muted)] hover:text-[var(--shell-text)]',
        )}
        aria-pressed={value === 'grid'}
        aria-label="Visualização em grade"
        onClick={() => onChange('grid')}
        data-testid="view-toggle-grid"
      >
        <LayoutGrid className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        className={cn(
          'inline-flex size-10 items-center justify-center rounded-md transition',
          value === 'list'
            ? 'bg-[var(--shell-sidebar-active-bg)] text-[var(--shell-text)]'
            : 'text-[var(--shell-text-muted)] hover:text-[var(--shell-text)]',
        )}
        aria-pressed={value === 'list'}
        aria-label="Visualização em lista"
        onClick={() => onChange('list')}
        data-testid="view-toggle-list"
      >
        <List className="size-4" aria-hidden />
      </button>
    </div>
  );
}
