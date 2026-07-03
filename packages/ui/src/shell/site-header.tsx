'use client';

import type { ReactNode } from 'react';

import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '../cn';

export interface SiteHeaderProps {
  breadcrumbs?: ReactNode;
  title?: ReactNode;
  actions?: ReactNode;
  /** @deprecated Alias legado — preferir `sidebarTriggerTestId`. */
  mobileMenuTestId?: string;
  sidebarTriggerTestId?: string;
  className?: string;
}

/** Header sticky com SidebarTrigger — padrão dashboard-01. */
export function SiteHeader({
  breadcrumbs,
  title,
  actions,
  mobileMenuTestId,
  sidebarTriggerTestId,
  className,
}: SiteHeaderProps) {
  const triggerTestId = sidebarTriggerTestId ?? mobileMenuTestId ?? 'sidebar-trigger';
  return (
    <header
      className={cn(
        'flex h-[var(--shell-header-height)] shrink-0 items-center gap-2 border-b border-border px-4',
        className,
      )}
      data-testid="app-header"
    >
      <SidebarTrigger className="-ml-1" data-testid={triggerTestId} />
      <Separator orientation="vertical" className="mr-2 h-4 data-[orientation=vertical]:h-4" />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        {breadcrumbs}
        {title != null ? (
          <h1 className="truncate text-base font-semibold text-foreground lg:hidden">{title}</h1>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
