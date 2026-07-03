'use client';

import type { ReactNode } from 'react';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { cn } from '../cn';
import { resolveSurface, type PanelSurface } from '../surface';
import { SiteHeader, type SiteHeaderProps } from './site-header';

export interface AppShellProps {
  /** Conteúdo da sidebar (`AppSidebar` + `NavUser`). */
  sidebar?: ReactNode;
  children: ReactNode;
  surface?: PanelSurface;
  /** Header com breadcrumbs e ações (usa `SiteHeader` internamente se passar props). */
  header?: ReactNode;
  /** Atalhos para montar header via SiteHeader. */
  headerProps?: SiteHeaderProps;
  toolbar?: ReactNode;
  banner?: ReactNode;
  /** @deprecated Mobile menu integrado ao SidebarProvider — ignorado. */
  mobileMenuTestId?: string;
  /** @deprecated Use prop `sidebar`. */
  renderSidebar?: (closeMobileMenu: () => void) => ReactNode;
}

const insetStyles: Record<PanelSurface, string> = {
  admin: 'bg-[var(--shell-bg)] text-[var(--shell-text)]',
  platform: 'bg-[var(--shell-bg)] text-[var(--shell-text)]',
};

/** Layout dashboard-01 — SidebarProvider + SidebarInset. */
export function AppShell({
  sidebar,
  children,
  surface = 'admin',
  header,
  headerProps,
  toolbar,
  banner,
  renderSidebar,
}: AppShellProps) {
  const resolved = resolveSurface(surface);
  const sidebarNode = sidebar ?? (renderSidebar ? renderSidebar(() => {}) : null);

  const headerNode =
    header ??
    (headerProps ? <SiteHeader {...headerProps} /> : null);

  return (
    <SidebarProvider
      data-ui-surface={resolved}
      data-testid="app-shell"
      style={
        {
          '--sidebar-width': 'var(--shell-sidebar-width)',
          '--header-height': 'var(--shell-header-height)',
        } as React.CSSProperties
      }
    >
      {sidebarNode}
      <SidebarInset className={cn('flex min-h-svh flex-col', insetStyles[resolved])}>
        {headerNode}
        {toolbar ? (
          <div
            className="border-b border-[var(--shell-border)] bg-[var(--shell-bg)] px-4 py-3 sm:px-8"
            data-testid="page-toolbar"
          >
            {toolbar}
          </div>
        ) : null}
        {banner}
        <main className="flex-1 px-[var(--shell-content-padding-x)] py-[var(--shell-content-padding-y)]">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
