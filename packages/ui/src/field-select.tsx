'use client';

import type { ComponentProps, ReactNode } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  adminSelectTriggerClass,
  platformSelectTriggerClass,
  storeSelectTriggerClass,
  type SidebarTheme,
  type UiSurface,
} from './surface';

const EMPTY_SENTINEL = '__field_select_empty__';

export interface FieldSelectProps {
  surface?: UiSurface;
  /** @deprecated Use `surface`. */
  theme?: SidebarTheme;
  value: string;
  onValueChange: (value: string) => void;
  id?: string;
  'data-testid'?: string;
  placeholder?: string;
  /** Rótulo da opção vazia — habilita valor `""` via sentinel interno. */
  emptyLabel?: string;
  disabled?: boolean;
  triggerClassName?: string;
  contentClassName?: string;
  children: ReactNode;
}

function resolveUiSurface(surface?: UiSurface, theme?: SidebarTheme): UiSurface {
  if (surface) return surface;
  if (theme === 'platform') return 'platform';
  return 'admin';
}

function triggerClassForSurface(surface: UiSurface, className?: string) {
  if (surface === 'store') {
    return cn(storeSelectTriggerClass(), 'w-[min(100%,16rem)]', className);
  }
  if (surface === 'platform') {
    return cn(platformSelectTriggerClass(), 'w-[min(100%,16rem)]', className);
  }
  return cn(adminSelectTriggerClass(), 'w-[min(100%,16rem)]', className);
}

/** Select shadcn (Radix) com tokens Ata por surface. */
export function FieldSelect({
  surface,
  theme,
  value,
  onValueChange,
  id,
  'data-testid': testId,
  placeholder,
  emptyLabel,
  disabled,
  triggerClassName,
  contentClassName,
  children,
}: FieldSelectProps) {
  const uiSurface = resolveUiSurface(surface, theme);
  const allowsEmpty = emptyLabel != null;
  const selectValue = allowsEmpty && value === '' ? EMPTY_SENTINEL : value;
  const portalSurface = uiSurface;

  function handleValueChange(next: string) {
    onValueChange(allowsEmpty && next === EMPTY_SENTINEL ? '' : next);
  }

  return (
    <Select value={selectValue} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        data-testid={testId}
        className={triggerClassForSurface(uiSurface, triggerClassName)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="item-aligned"
        align="start"
        data-ui-surface={portalSurface}
        className={cn('z-50 border-border bg-popover text-popover-foreground', contentClassName)}
      >
        {allowsEmpty ? (
          <FieldSelectItem value={EMPTY_SENTINEL}>{emptyLabel}</FieldSelectItem>
        ) : null}
        {children}
      </SelectContent>
    </Select>
  );
}

export function FieldSelectItem({
  className,
  ...props
}: ComponentProps<typeof SelectItem>) {
  return (
    <SelectItem
      className={cn('cursor-pointer focus:bg-accent focus:text-accent-foreground', className)}
      {...props}
    />
  );
}
