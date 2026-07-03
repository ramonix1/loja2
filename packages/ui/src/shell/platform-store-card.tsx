'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '../card';
import { cn } from '../cn';
import type { PanelSurface } from '../surface';

export type PlatformStoreHealth = 'healthy' | 'attention' | 'suspended';

const healthLabel: Record<PlatformStoreHealth, string> = {
  healthy: 'Saudável',
  attention: 'Atenção',
  suspended: 'Suspensa',
};

const healthClass: Record<PlatformStoreHealth, string> = {
  healthy: 'border-transparent bg-[var(--platform-success-bg)] text-[var(--platform-success)]',
  attention: 'border-transparent bg-[var(--platform-warning-bg)] text-[var(--platform-warning)]',
  suspended: 'border-transparent bg-[var(--platform-error-bg)] text-[var(--platform-error)]',
};

export interface PlatformStoreCardProps {
  slug: string;
  nome: string;
  plano?: string | null;
  merchantName?: string | null;
  ativo: boolean;
  health?: PlatformStoreHealth;
  vitrineHref?: string;
  editAction?: React.ReactNode;
  surface?: PanelSurface;
  className?: string;
  testId?: string;
}

export function PlatformStoreCard({
  slug,
  nome,
  plano,
  merchantName,
  ativo,
  health,
  vitrineHref,
  editAction,
  surface = 'platform',
  className,
  testId,
}: PlatformStoreCardProps) {
  const resolvedHealth: PlatformStoreHealth =
    health ?? (ativo ? 'healthy' : 'suspended');

  return (
    <Card
      surface={surface}
      className={cn('flex h-full flex-col p-0', className)}
      data-testid={testId ?? `platform-store-card-${slug}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-[var(--shell-border)] p-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-[var(--shell-text)]">{nome}</h3>
          <p className="mt-0.5 text-xs text-[var(--shell-text-muted)]">/store/{slug}</p>
        </div>
        <Badge className={cn('shrink-0', healthClass[resolvedHealth])}>
          {ativo ? healthLabel[resolvedHealth] : 'Suspensa'}
        </Badge>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-3 p-4 text-sm">
        <div>
          <div className="text-xs text-[var(--shell-text-muted)]">Plano</div>
          <div className="font-medium text-[var(--shell-text)]">{plano ?? '—'}</div>
        </div>
        <div>
          <div className="text-xs text-[var(--shell-text-muted)]">Performance</div>
          <div className="font-medium text-[var(--shell-text)]">{healthLabel[resolvedHealth]}</div>
        </div>
        <div>
          <div className="text-xs text-[var(--shell-text-muted)]">Merchant</div>
          <div className="truncate font-medium text-[var(--shell-text)]">{merchantName ?? '—'}</div>
        </div>
        <div>
          <div className="text-xs text-[var(--shell-text-muted)]">Slug</div>
          <div className="truncate font-medium text-[var(--shell-text)]">{slug}</div>
        </div>
      </div>

      {editAction || vitrineHref ? (
        <div className="flex gap-2 border-t border-[var(--shell-border)] p-4">
          {vitrineHref ? (
            <a
              href={vitrineHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 flex-1 touch-manipulation items-center justify-center rounded-lg border border-[var(--shell-border)] bg-[var(--shell-surface-elevated)] px-4 text-sm font-medium text-[var(--shell-text)] hover:bg-[var(--shell-sidebar-hover-bg)]"
            >
              Ver vitrine
            </a>
          ) : null}
          {editAction}
        </div>
      ) : null}
    </Card>
  );
}
