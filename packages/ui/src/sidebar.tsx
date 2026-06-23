import type { ReactNode } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from './cn';
import { resolveSurface, type PanelSurface, type SidebarTheme, type UiSurface } from './surface';

export type { SidebarTheme, UiSurface };

export interface SidebarProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** data-testid aplicado ao `<nav>` (ex.: `admin-sidebar-nav`). */
  navTestId?: string;
  className?: string;
  surface?: PanelSurface;
  /** Paleta Ata Commerce (azul) ou Ata Labs (verde). @deprecated Use `surface`. */
  theme?: SidebarTheme;
}

export const sidebarShellClass: Record<PanelSurface, string> = {
  admin:
    'border-[var(--admin-sidebar-border)] bg-[var(--admin-sidebar-bg)] text-[var(--admin-sidebar-text)]',
  platform:
    'border-[var(--platform-sidebar-border)] bg-[var(--platform-sidebar-bg)] text-[var(--platform-sidebar-text)]',
};

const surfaceStyles: Record<
  PanelSurface,
  { header: string; subtitle: string; footer: string; title: string }
> = {
  admin: {
    header: 'border-[var(--admin-sidebar-border)]',
    subtitle: 'text-[var(--admin-sidebar-muted)]',
    footer: 'border-[var(--admin-sidebar-border)]',
    title: 'text-[var(--admin-sidebar-text)]',
  },
  platform: {
    header: 'border-[var(--platform-sidebar-border)]',
    subtitle: 'text-[var(--platform-sidebar-muted)]',
    footer: 'border-[var(--platform-sidebar-border)]',
    title: 'text-[var(--platform-sidebar-text)]',
  },
};

/**
 * Conteúdo interno da sidebar (header, nav com scroll, footer).
 * Usado no aside desktop (`LayoutAdmin`) e no `Sheet` mobile.
 */
export function SidebarPanel({
  title,
  subtitle,
  children,
  footer,
  navTestId,
  className,
  surface,
  theme = 'commerce',
}: SidebarProps) {
  const resolved = resolveSurface(surface, theme);
  const t = surfaceStyles[resolved];

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div className={cn('shrink-0 border-b p-6', t.header)}>
        <div className={cn('text-lg font-bold leading-tight', t.title)}>{title}</div>
        {subtitle != null && (
          <div className={cn('text-xs font-medium', t.subtitle)}>{subtitle}</div>
        )}
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <nav data-testid={navTestId} className="space-y-1 p-4">
          {children}
        </nav>
      </ScrollArea>
      {footer != null && (
        <div className={cn('shrink-0 space-y-1 border-t p-4', t.footer)}>{footer}</div>
      )}
    </div>
  );
}

/**
 * Barra lateral fixa (desktop). Em mobile, prefira `LayoutAdmin` + `SidebarPanel`.
 */
export function Sidebar(props: SidebarProps) {
  const resolved = resolveSurface(props.surface, props.theme);
  return (
    <aside
      className={cn(
        'fixed hidden h-full w-60 flex-col border-r lg:flex',
        sidebarShellClass[resolved],
        props.className,
      )}
    >
      <SidebarPanel {...props} />
    </aside>
  );
}
