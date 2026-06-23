import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/** Classes de status alinhadas aos tokens Ata (ex-ds-badge-*). */
const STATUS_BADGE_CLASS: Record<string, string> = {
  pago: 'border-transparent bg-[var(--admin-success-bg)] text-[var(--admin-success-text)] hover:bg-[var(--admin-success-bg)]',
  aguardando_pagamento:
    'border-transparent bg-[var(--admin-warning-bg)] text-[var(--admin-warning-text)] hover:bg-[var(--admin-warning-bg)]',
  em_separacao:
    'border-transparent bg-[color-mix(in_srgb,var(--ata-azul-vivido)_16%,var(--admin-surface))] text-[var(--ata-azul-vivido)] hover:bg-[color-mix(in_srgb,var(--ata-azul-vivido)_16%,var(--admin-surface))]',
  enviado:
    'border-transparent bg-[color-mix(in_srgb,var(--ata-azul-ceu)_16%,var(--admin-surface))] text-[var(--ata-azul-ceu)] hover:bg-[color-mix(in_srgb,var(--ata-azul-ceu)_16%,var(--admin-surface))]',
  entregue:
    'border-transparent bg-[var(--admin-success-bg)] text-[var(--admin-success-text)] hover:bg-[var(--admin-success-bg)]',
  cancelado:
    'border-transparent bg-[var(--admin-error-bg)] text-[var(--admin-error-text)] hover:bg-[var(--admin-error-bg)]',
};

const DEFAULT_BADGE_CLASS =
  'border-transparent bg-[var(--admin-badge-neutral-bg)] text-[var(--admin-badge-neutral-text)] hover:bg-[var(--admin-badge-neutral-bg)]';

export function statusBadgeClass(status: string, className?: string) {
  return cn(STATUS_BADGE_CLASS[status] ?? DEFAULT_BADGE_CLASS, className);
}

/** @deprecated Preferir `<StatusBadge>` — mantido para spans legados. */
export function adminStatusBadgeClass(status: string, className?: string) {
  return statusBadgeClass(status, className);
}

export interface StatusBadgeProps {
  status: string;
  className?: string;
  children: ReactNode;
}

/** Badge de status de pedido/conta — shadcn + tokens semânticos admin. */
export function StatusBadge({ status, className, children }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(statusBadgeClass(status), className)}>
      {children}
    </Badge>
  );
}
