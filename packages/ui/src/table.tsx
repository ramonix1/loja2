import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, TableHTMLAttributes } from 'react';

import {
  TableCell as ShadcnTableCell,
  TableHead as ShadcnTableHead,
  TableHeader as ShadcnTableHeader,
  TableRow as ShadcnTableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { resolveSurface, type SidebarTheme, type UiSurface } from './surface';

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  surface?: UiSurface;
  /** @deprecated Use `surface`. */
  theme?: SidebarTheme;
}

export function Table({ surface, theme, className, ...props }: TableProps) {
  const resolved = resolveSurface(surface, theme);
  const borderVar =
    resolved === 'admin' ? 'var(--admin-table-border)' : 'var(--platform-table-border)';

  return (
    <div
      data-slot="table-container"
      className={cn(
        'ds-scrollbar relative w-full overflow-x-auto rounded-xl border',
        resolved === 'admin' ? 'ds-scrollbar-admin' : 'ds-scrollbar-platform',
      )}
      style={{ borderColor: borderVar }}
    >
      <table
        data-slot="table"
        className={cn(
          'w-full caption-bottom border-collapse text-left text-sm',
          resolved === 'admin' ? 'text-[var(--admin-text)]' : 'text-[var(--platform-text)]',
          className,
        )}
        {...props}
      />
    </div>
  );
}

export interface TableHeadProps extends HTMLAttributes<HTMLTableSectionElement> {
  surface?: UiSurface;
  theme?: SidebarTheme;
}

export function TableHead({ surface, theme, className, ...props }: TableHeadProps) {
  const resolved = resolveSurface(surface, theme);

  return (
    <ShadcnTableHeader
      className={cn(
        resolved === 'admin'
          ? 'bg-[var(--admin-table-header-bg)] text-[var(--admin-text-muted)]'
          : 'bg-[var(--platform-table-header-bg)] text-[var(--platform-text-muted)]',
        className,
      )}
      {...props}
    />
  );
}

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  surface?: UiSurface;
  theme?: SidebarTheme;
}

export function TableRow({ surface, theme, className, ...props }: TableRowProps) {
  const resolved = resolveSurface(surface, theme);

  return (
    <ShadcnTableRow
      className={cn(
        resolved === 'admin'
          ? 'border-[var(--admin-table-border)] hover:bg-[var(--admin-table-row-hover)]'
          : 'border-[var(--platform-table-border)] hover:bg-[var(--platform-table-row-hover)]',
        className,
      )}
      {...props}
    />
  );
}

export function TableHeaderCell({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <ShadcnTableHead
      className={cn('px-4 py-3 text-xs font-semibold uppercase tracking-wide', className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <ShadcnTableCell className={cn('px-4 py-3 align-middle', className)} {...props} />;
}
