'use client';

import type { ComponentProps, ReactNode } from 'react';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

export interface FieldRadioGroupProps extends ComponentProps<typeof RadioGroup> {}

/** RadioGroup shadcn com layout de vitrine tenant (inline ou card-row). */
export function FieldRadioGroup({ className, ...props }: FieldRadioGroupProps) {
  return <RadioGroup className={cn('grid gap-2', className)} {...props} />;
}

export interface FieldRadioGroupItemProps extends ComponentProps<typeof RadioGroupItem> {
  /** `row`: frete/checkout; `inline`: pagamento. */
  variant?: 'inline' | 'row';
  /** Conteúdo principal (alternativa a `children`). */
  label?: ReactNode;
  /** Alinhado à direita no variant `row` (ex.: preço). */
  trailing?: ReactNode;
}

export function FieldRadioGroupItem({
  variant = 'inline',
  label,
  trailing,
  children,
  className,
  id,
  value,
  ...props
}: FieldRadioGroupItemProps) {
  const itemId = id ?? String(value);
  const content = label ?? children;

  if (variant === 'row') {
    return (
      <Label
        htmlFor={itemId}
        className={cn(
          'flex cursor-pointer items-center justify-between rounded-lg border border-[var(--store-border)] p-3 hover:bg-[var(--store-surface-elevated)] has-[[data-state=checked]]:border-[var(--cor-primaria)] has-[[data-state=checked]]:bg-[var(--store-surface-elevated)]',
          className,
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <RadioGroupItem id={itemId} value={value} {...props} />
          <span className="min-w-0">{content}</span>
        </span>
        {trailing}
      </Label>
    );
  }

  return (
    <Label htmlFor={itemId} className={cn('flex cursor-pointer items-center gap-2', className)}>
      <RadioGroupItem id={itemId} value={value} {...props} />
      {content}
    </Label>
  );
}
