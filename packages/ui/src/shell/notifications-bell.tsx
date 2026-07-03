'use client';

import { HiOutlineBell } from '../icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../button';
import { cn } from '../cn';
import type { PanelSurface } from '../surface';

export interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  href?: string;
  onSelect?: () => void;
}

export interface NotificationsBellProps {
  surface?: PanelSurface;
  items: ReadonlyArray<NotificationItem>;
  label?: string;
  emptyMessage?: string;
  className?: string;
}

/** Sino de notificações genérico (header) — badge de contagem + lista simples (P3). */
export function NotificationsBell({
  surface = 'admin',
  items,
  label = 'Notificações',
  emptyMessage = 'Nenhuma notificação no momento.',
  className,
}: NotificationsBellProps) {
  const count = items.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          surface={surface}
          className={cn('relative size-10 shrink-0 p-0', className)}
          aria-label={label}
          data-testid="notifications-trigger"
        >
          <HiOutlineBell className="size-5" aria-hidden />
          {count > 0 ? (
            <span
              className="absolute top-1.5 right-1.5 flex size-4 min-w-4 items-center justify-center rounded-full bg-[var(--shell-accent)] px-1 text-[0.625rem] leading-none font-semibold text-white"
              data-testid="notifications-count"
            >
              {count > 9 ? '9+' : count}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        data-ui-surface={surface}
        className="w-72"
        data-testid="notifications-list"
      >
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p
            className="px-2 py-4 text-center text-sm text-muted-foreground"
            data-testid="notifications-empty"
          >
            {emptyMessage}
          </p>
        ) : (
          items.map((item) => (
            <DropdownMenuItem
              key={item.id}
              asChild={Boolean(item.href)}
              onClick={item.onSelect}
              data-testid={`notifications-item-${item.id}`}
              className="flex-col items-start gap-0.5 whitespace-normal"
            >
              {item.href ? (
                <a href={item.href}>
                  <span className="text-sm font-medium">{item.title}</span>
                  {item.description ? (
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  ) : null}
                </a>
              ) : (
                <>
                  <span className="text-sm font-medium">{item.title}</span>
                  {item.description ? (
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  ) : null}
                </>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
