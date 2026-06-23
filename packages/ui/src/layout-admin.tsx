import { MenuIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from './button';
import { cn } from './cn';
import { sidebarShellClass } from './sidebar';
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

const mainStyles: Record<PanelSurface, string> = {
  admin: 'bg-[var(--admin-bg)] text-[var(--admin-text)]',
  platform: 'bg-[var(--platform-bg)] text-[var(--platform-text)]',
};

const mobileHeaderStyles: Record<PanelSurface, string> = {
  admin: 'border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] text-[var(--admin-text)]',
  platform:
    'border-[var(--platform-border)] bg-[var(--platform-surface-elevated)] text-[var(--platform-text)]',
};

/** Layout base do admin: sidebar fixa (lg+) + Sheet mobile + área de conteúdo. */
export function LayoutAdmin({
  renderSidebar,
  children,
  surface,
  theme = 'commerce',
  uiMode: _uiMode = 'escuro',
  mobileMenuTestId,
  mobileMenuLabel = 'Abrir menu de navegação',
}: LayoutAdminProps) {
  const resolved = resolveSurface(surface, theme);
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  return (
    <div className={cn('min-h-screen', mainStyles[resolved])} data-ui-surface={resolved}>
      <aside
        className={cn(
          'fixed hidden h-full w-60 flex-col border-r lg:flex',
          sidebarShellClass[resolved],
        )}
      >
        {renderSidebar(() => {})}
      </aside>

      <header
        className={cn(
          'sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b px-4 lg:hidden',
          mobileHeaderStyles[resolved],
        )}
      >
        <Button
          type="button"
          variant="ghost"
          surface={resolved}
          className="size-10 shrink-0 p-0"
          aria-label={mobileMenuLabel}
          data-testid={mobileMenuTestId}
          onClick={() => setMobileOpen(true)}
        >
          <MenuIcon className="size-5" aria-hidden />
        </Button>
      </header>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          showCloseButton
          className={cn(
            'w-60 max-w-[85vw] gap-0 border-r p-0 sm:max-w-xs',
            sidebarShellClass[resolved],
          )}
        >
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <SheetDescription className="sr-only">
            Links principais do painel
          </SheetDescription>
          {renderSidebar(closeMobileMenu)}
        </SheetContent>
      </Sheet>

      <main className="p-4 sm:p-8 lg:ml-60">{children}</main>
    </div>
  );
}
