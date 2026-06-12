import type { ReactNode } from 'react';

import { cn } from './cn';

export interface SidebarProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** data-testid aplicado ao `<nav>` (ex.: `admin-sidebar-nav`). */
  navTestId?: string;
  className?: string;
}

/**
 * Barra lateral genérica (estrutura + estilo). O conteúdo de navegação (links)
 * é passado via `children` para não acoplar `packages/ui` ao roteador.
 */
export function Sidebar({
  title,
  subtitle,
  children,
  footer,
  navTestId,
  className,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed flex h-full w-60 flex-col border-r border-gray-800 bg-gray-900',
        className,
      )}
    >
      <div className="border-b border-gray-800 p-6">
        <div className="text-lg font-bold leading-tight text-white">{title}</div>
        {subtitle != null && (
          <div className="text-xs font-medium text-gray-400">{subtitle}</div>
        )}
      </div>
      <nav
        data-testid={navTestId}
        className="flex-1 space-y-1 overflow-y-auto p-4"
      >
        {children}
      </nav>
      {footer != null && (
        <div className="space-y-1 border-t border-gray-800 p-4">{footer}</div>
      )}
    </aside>
  );
}
