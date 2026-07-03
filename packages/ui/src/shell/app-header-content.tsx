'use client';

import type { ReactNode } from 'react';

import { cn } from '../cn';
import type { PanelSurface } from '../surface';

export interface AppHeaderContentProps {
  surface?: PanelSurface;
  breadcrumbs?: ReactNode;
  title?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/** Conteúdo interno do header (breadcrumbs + ações). Usar dentro do slot `header` do AppShell. */
export function AppHeaderContent({
  breadcrumbs,
  title,
  actions,
  className,
}: AppHeaderContentProps) {
  return (
    <div className={cn('flex min-w-0 flex-1 items-center justify-between gap-3', className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
        {breadcrumbs ? (
          <nav
            aria-label="Breadcrumb"
            className="hidden min-w-0 truncate text-sm text-[var(--shell-text-muted)] lg:block"
          >
            {breadcrumbs}
          </nav>
        ) : null}
        {title ? (
          <div className="truncate text-base font-semibold text-[var(--shell-text)] lg:hidden">
            {title}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export interface AppBreadcrumbProps {
  items: ReadonlyArray<{ label: string; href?: string }>;
  className?: string;
}

export function AppBreadcrumb({ items, className }: AppBreadcrumbProps) {
  return (
    <ol className={cn('flex min-w-0 flex-wrap items-center gap-1.5', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
            {index > 0 ? (
              <span className="text-[var(--shell-text-muted)]" aria-hidden>
                /
              </span>
            ) : null}
            {item.href && !isLast ? (
              <a
                href={item.href}
                className="truncate hover:text-[var(--shell-text)] hover:underline"
              >
                {item.label}
              </a>
            ) : (
              <span
                className={cn(
                  'truncate',
                  isLast ? 'font-medium text-[var(--shell-text)]' : undefined,
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
