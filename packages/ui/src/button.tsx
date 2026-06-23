import type { ButtonHTMLAttributes } from 'react';

import { Button as ShadcnButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { resolveSurface, type SidebarTheme, type UiSurface } from './surface';

type Variant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Ata Commerce (admin), Platform Hub ou vitrine tenant. */
  surface?: UiSurface;
  /** @deprecated Use `surface`. */
  theme?: SidebarTheme;
}

const SHADCN_VARIANT: Record<Variant, 'default' | 'secondary' | 'ghost'> = {
  primary: 'default',
  secondary: 'secondary',
  ghost: 'ghost',
};

/** Cores explícitas por surface — necessário fora de `[data-ui-surface]` (ex.: login platform). */
const SURFACE_VARIANT: Record<UiSurface, Record<Variant, string>> = {
  admin: {
    primary:
      'bg-[var(--admin-accent)] text-white hover:bg-[var(--admin-accent-hover)] disabled:opacity-50',
    secondary:
      'border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] text-[var(--admin-text)] hover:bg-[var(--admin-table-row-hover)] disabled:opacity-50',
    ghost:
      'bg-transparent text-[var(--admin-text-muted)] hover:bg-[var(--admin-sidebar-hover-bg)] hover:text-[var(--admin-text)]',
  },
  platform: {
    primary:
      'bg-[var(--platform-accent)] text-white hover:bg-[var(--platform-accent-hover)] disabled:opacity-50',
    secondary:
      'border border-[var(--platform-border)] bg-[var(--platform-surface-elevated)] text-[var(--platform-text)] hover:bg-[var(--platform-table-row-hover)] disabled:opacity-50',
    ghost:
      'bg-transparent text-[var(--platform-text-muted)] hover:bg-[var(--platform-sidebar-hover-bg)] hover:text-[var(--platform-text)]',
  },
  store: {
    primary:
      'bg-[var(--cor-primaria)] text-white hover:brightness-95 disabled:opacity-50',
    secondary:
      'border border-[var(--store-border)] bg-[var(--store-surface)] text-[var(--store-text)] hover:bg-[var(--store-surface-elevated)] disabled:opacity-50',
    ghost:
      'bg-transparent text-[var(--store-text-muted)] hover:bg-[var(--store-surface-elevated)] hover:text-[var(--store-text)]',
  },
};

export function Button({
  variant = 'primary',
  surface,
  theme,
  className,
  ...props
}: ButtonProps) {
  const resolved = resolveSurface(surface, theme);
  const variantClass =
    surface === 'store'
      ? SURFACE_VARIANT.store[variant]
      : SURFACE_VARIANT[resolved][variant];

  return (
    <ShadcnButton
      variant={SHADCN_VARIANT[variant]}
      className={cn(
        'min-h-[2.75rem] touch-manipulation rounded-lg px-4 py-2',
        variantClass,
        className,
      )}
      {...props}
    />
  );
}
