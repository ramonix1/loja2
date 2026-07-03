'use client';

import { ActionIcons } from '../icons';
import { Button } from '../button';
import { cn } from '../cn';
import type { PanelSurface } from '../surface';

export interface PaginationBarProps {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  surface?: PanelSurface;
  className?: string;
  testId?: string;
}

function pageRange(page: number, perPage: number, total: number): { from: number; to: number } {
  if (total === 0) return { from: 0, to: 0 };
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  return { from, to };
}

export function PaginationBar({
  page,
  perPage,
  total,
  onPageChange,
  surface = 'platform',
  className,
  testId,
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const { from, to } = pageRange(page, perPage, total);
  const PrevIcon = ActionIcons.prev;
  const NextIcon = ActionIcons.next;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
      data-testid={testId ?? 'pagination-bar'}
    >
      <p className="text-sm text-[var(--shell-text-muted)]">
        Mostrando {from}–{to} de {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          surface={surface}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Página anterior"
          data-testid="pagination-prev"
        >
          <PrevIcon className="size-4" aria-hidden />
        </Button>
        <span className="min-w-[4rem] text-center text-sm text-[var(--shell-text)]">
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="secondary"
          surface={surface}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Próxima página"
          data-testid="pagination-next"
        >
          <NextIcon className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
