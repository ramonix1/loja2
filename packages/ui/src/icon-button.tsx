import type { ReactNode } from 'react';

import { cn } from './lib/utils';
import type { UiSurface } from './surface';

export type IconButtonVariant = 'ghost' | 'destructive' | 'accent';
export type IconButtonSize = 'md' | 'lg';

export interface IconButtonProps {
  /** Ícone (ex.: `<HiOutlineTrash />` de `@lojao/ui/icons`). */
  icon: ReactNode;
  /** Rótulo acessível obrigatório — vira `aria-label` + `title`. */
  label: string;
  onClick?: () => void;
  /** Se presente, renderiza `<a>` em vez de `<button>`. */
  href?: string;
  /** Abre o link em nova aba (`href` apenas). */
  external?: boolean;
  variant?: IconButtonVariant;
  /** `md` = 44px · `lg` = 48px (default). Mobile-first: nunca abaixo de 44px. */
  size?: IconButtonSize;
  /** Superfície de tokens: admin (Commerce), platform (Labs) ou store (vitrine). */
  surface?: UiSurface;
  testId?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}

const SIZE_CLASS: Record<IconButtonSize, string> = {
  md: 'min-h-11 min-w-11 text-lg',
  lg: 'min-h-12 min-w-12 text-xl',
};

const VARIANT_CLASS: Record<UiSurface, Record<IconButtonVariant, string>> = {
  admin: {
    ghost:
      'text-[var(--admin-text-muted)] hover:bg-[var(--admin-sidebar-hover-bg)] hover:text-[var(--admin-text)]',
    destructive:
      'text-[var(--admin-error-text)] hover:bg-[var(--admin-error-bg)]',
    accent:
      'text-[var(--admin-accent)] hover:bg-[var(--admin-sidebar-hover-bg)]',
  },
  platform: {
    ghost:
      'text-[var(--platform-text-muted)] hover:bg-[var(--platform-sidebar-hover-bg)] hover:text-[var(--platform-text)]',
    destructive:
      'text-[var(--platform-error)] hover:bg-[var(--platform-error-bg)]',
    accent:
      'text-[var(--platform-accent)] hover:bg-[var(--platform-sidebar-hover-bg)]',
  },
  store: {
    ghost:
      'text-[var(--store-text-muted)] hover:bg-[var(--store-surface-elevated)] hover:text-[var(--store-text)]',
    destructive:
      'text-[var(--store-error)] hover:bg-[var(--store-surface-elevated)]',
    accent:
      'text-[var(--cor-primaria)] hover:bg-[var(--store-surface-elevated)]',
  },
};

const FOCUS_CLASS: Record<UiSurface, string> = {
  admin: 'focus-visible:outline-[var(--admin-focus-ring)]',
  platform: 'focus-visible:outline-[var(--platform-focus-ring)]',
  store: 'focus-visible:outline-[var(--store-focus-ring)]',
};

/**
 * Botão de ação com ícone (mobile-first, touch ≥44px).
 *
 * Decisões D4/D6 da spec dark-theme-icons: área mínima 48×48 (`lg`),
 * `aria-label` + `title` obrigatórios, variante `destructive` para ações
 * de exclusão. Tokens semânticos por `surface`.
 */
export function IconButton({
  icon,
  label,
  onClick,
  href,
  external = false,
  variant = 'ghost',
  size = 'lg',
  surface = 'admin',
  testId,
  disabled = false,
  type = 'button',
  className,
}: IconButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center rounded-lg touch-manipulation transition',
    'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0',
    'disabled:opacity-50 disabled:pointer-events-none aria-disabled:opacity-50 aria-disabled:pointer-events-none',
    SIZE_CLASS[size],
    VARIANT_CLASS[surface][variant],
    FOCUS_CLASS[surface],
    className,
  );

  if (href) {
    return (
      <a
        href={href}
        aria-label={label}
        title={label}
        data-testid={testId}
        aria-disabled={disabled || undefined}
        className={classes}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        <span aria-hidden="true" className="inline-flex">
          {icon}
        </span>
      </a>
    );
  }

  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      className={classes}
    >
      <span aria-hidden="true" className="inline-flex">
        {icon}
      </span>
    </button>
  );
}
