import type { StoreTheme } from '@lojao/types/store-theme';

export { DEFAULT_LOJA_COR_PRIMARIA } from '@lojao/types/aparencia';

type ClassValue = string | false | null | undefined;

function cn(...parts: ClassValue[]) {
  return parts.filter(Boolean).join(' ');
}

export function storePageTitleClass(className?: string) {
  return cn('text-3xl font-extrabold text-[var(--store-text)]', className);
}

export function storeSectionTitleClass(className?: string) {
  return cn('text-2xl font-bold text-[var(--store-text)]', className);
}

export function storeHeadingClass(className?: string) {
  return cn('text-lg font-bold text-[var(--store-text)]', className);
}

export function storeMutedClass(className?: string) {
  return cn('text-[var(--store-text-muted)]', className);
}

export function storeSubtleClass(className?: string) {
  return cn('text-[var(--store-text-subtle)]', className);
}

export function storeBodyClass(className?: string) {
  return cn('text-[var(--store-text)]', className);
}

export function storeLabelClass(className?: string) {
  return cn('mb-1 block text-sm font-medium text-[var(--store-text-muted)]', className);
}

export function storeInputClass(className?: string) {
  return cn('ds-input', className);
}

export function storeCardClass(className?: string) {
  return cn(
    'rounded-xl border border-[var(--store-border)] bg-[var(--store-surface)] text-[var(--store-text)]',
    className,
  );
}

export function storePanelClass(className?: string) {
  return cn(storeCardClass(), 'p-6 shadow-sm', className);
}

export function storeLinkClass(className?: string) {
  return cn('text-[var(--store-link)] hover:text-[var(--store-link)] hover:underline', className);
}

export function storeTableWrapClass(className?: string) {
  return cn(
    'overflow-hidden rounded-xl border border-[var(--store-border)] bg-[var(--store-surface)]',
    className,
  );
}

export function storeTableHeadClass(className?: string) {
  return cn(
    'border-b border-[var(--store-border)] bg-[var(--store-surface-elevated)] text-[var(--store-text-muted)]',
    className,
  );
}

export function storeTableRowClass(className?: string) {
  return cn('border-b border-[var(--store-border)] last:border-0', className);
}

export function storeEmptyStateClass(className?: string) {
  return cn(
    'rounded-xl border border-dashed border-[var(--store-border)] bg-[var(--store-surface)] p-12 text-center',
    className,
  );
}

export function storeOptionRowClass(className?: string) {
  return cn(
    'flex cursor-pointer items-center justify-between rounded-lg border border-[var(--store-border)] p-3 hover:bg-[var(--store-surface-elevated)]',
    className,
  );
}

export function storeErrorTextClass(className?: string) {
  return cn('text-[var(--store-error)]', className);
}

/** Header/footer/nav — cores via `--store-*` (loja_tema da API, sem toggle visitante). */
export function storeShellClasses(_tema: StoreTheme) {
  return {
    page: 'bg-[var(--store-bg)] text-[var(--store-text)]',
    header: 'border-[var(--store-border)] bg-[var(--store-header-bg)] text-[var(--store-text)]',
    navLink:
      'text-[var(--store-text-muted)] hover:text-[var(--store-link)] transition-colors touch-manipulation',
    footer: 'border-[var(--store-border)] bg-[var(--store-footer-bg)] text-[var(--store-text-muted)]',
    footerTitle: 'text-[var(--store-text)]',
  };
}
