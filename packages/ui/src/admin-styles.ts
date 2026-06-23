import { cn } from './cn';

export { DEFAULT_LOJA_COR_PRIMARIA } from '@lojao/types/aparencia';

export function adminPageTitleClass(className?: string) {
  return cn('text-2xl font-bold text-[var(--admin-text)]', className);
}

export function adminPageSubtitleClass(className?: string) {
  return cn('text-sm text-[var(--admin-text-muted)]', className);
}

export function adminSectionTitleClass(className?: string) {
  return cn('text-base font-bold text-[var(--admin-text)]', className);
}

export function adminFieldLabelClass(className?: string) {
  return cn('mb-1.5 block text-sm font-medium text-[var(--admin-text-muted)]', className);
}

export function adminFileInputClass(className?: string) {
  return cn(
    'block w-full text-sm text-[var(--admin-text-muted)]',
    'file:mr-3 file:min-h-10 file:cursor-pointer file:rounded-lg file:border-0',
    'file:bg-[var(--admin-surface-elevated)] file:px-4 file:py-2 file:text-sm file:font-medium',
    'file:text-[var(--admin-text)] hover:file:bg-[var(--admin-table-row-hover)]',
    className,
  );
}

export function adminPeriodPillClass(isActive: boolean, className?: string) {
  return cn(
    'rounded-md px-3 py-1.5 text-xs font-medium transition-colors touch-manipulation',
    isActive
      ? 'bg-[var(--admin-accent)] text-white'
      : 'text-[var(--admin-text-muted)] hover:bg-[var(--admin-table-row-hover)] hover:text-[var(--admin-text)]',
    className,
  );
}

export function adminStatValueClass(className?: string) {
  return cn('text-3xl font-bold text-[var(--admin-text)]', className);
}

export function adminStatValueSuccessClass(className?: string) {
  return cn('text-3xl font-bold text-[var(--admin-success)]', className);
}

export function adminSkeletonBlockClass(className?: string) {
  return cn(
    'animate-pulse rounded-xl bg-[var(--admin-surface-elevated)]',
    className,
  );
}

export function adminEmptyStateClass(className?: string) {
  return cn(
    'rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)]/50 px-6 py-16 text-center',
    className,
  );
}

export function adminSegmentedControlClass(className?: string) {
  return cn(
    'flex gap-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-1',
    className,
  );
}
