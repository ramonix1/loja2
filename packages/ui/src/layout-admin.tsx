'use client';

import type { ReactNode } from 'react';

import { AppShell } from './shell/app-shell';
import { resolveSurface, type PanelSurface, type SidebarTheme } from './surface';

export type AdminUiMode = 'escuro' | 'claro';

export interface LayoutAdminProps {
  /** Painel da sidebar — renderizado no aside desktop e no Sheet mobile. */
  renderSidebar: (closeMobileMenu: () => void) => ReactNode;
  children: ReactNode;
  surface?: PanelSurface;
  /** @deprecated Use `surface`. */
  theme?: SidebarTheme;
  /** Preferência local do painel — claro facilita uso no celular ao sol. */
  uiMode?: AdminUiMode;
  /** data-testid do botão hamburger (visível em viewport &lt; lg). */
  mobileMenuTestId?: string;
  /** Rótulo acessível do botão hamburger. */
  mobileMenuLabel?: string;
}

/**
 * Layout base do admin: sidebar fixa (lg+) + Sheet mobile + área de conteúdo.
 * @deprecated Preferir `AppShell` — delega internamente para compatibilidade.
 */
export function LayoutAdmin({
  renderSidebar,
  children,
  surface,
  theme = 'commerce',
  uiMode: _uiMode = 'escuro',
  mobileMenuTestId,
  mobileMenuLabel: _mobileMenuLabel,
}: LayoutAdminProps) {
  const resolvedSurface = resolveSurface(surface, theme);

  return (
    <AppShell
      surface={resolvedSurface}
      renderSidebar={renderSidebar}
      mobileMenuTestId={mobileMenuTestId}
    >
      {children}
    </AppShell>
  );
}

export type { AppShellProps } from './shell/app-shell';
export { AppShell };
