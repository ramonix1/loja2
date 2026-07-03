'use client';

import { Button, FieldInput } from '@lojao/ui';
import { ActionIcons } from '@lojao/ui/icons';
import { store as testIds } from '@lojao/test-utils/test-ids/store';

import { storeButtonPillClass } from '@/lib/store-styles';

interface QuantitySelectorProps {
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export function QuantitySelector({
  value,
  min = 1,
  max,
  disabled = false,
  onChange,
}: QuantitySelectorProps) {
  const atMin = value <= min;
  const atMax = max != null && value >= max;

  function decrement() {
    if (!atMin) onChange(value - 1);
  }

  function increment() {
    if (!atMax) onChange(value + 1);
  }

  function handleInput(raw: string) {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) return;
    let next = Math.max(min, parsed);
    if (max != null) next = Math.min(max, next);
    onChange(next);
  }

  const MinusIcon = ActionIcons.minus;
  const PlusIcon = ActionIcons.plus;

  return (
    <div
      data-testid={testIds.productQty}
      className={`inline-flex min-h-11 items-center border border-[var(--store-border)] bg-[var(--store-surface)] ${storeButtonPillClass()}`}
    >
      <Button
        type="button"
        surface="store"
        variant="ghost"
        aria-label="Diminuir quantidade"
        disabled={disabled || atMin}
        onClick={decrement}
        className="min-h-11 min-w-11 rounded-none rounded-l-[var(--store-radius-pill)] px-0"
      >
        <MinusIcon className="size-4" aria-hidden />
      </Button>
      <FieldInput
        surface="store"
        type="number"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        aria-label="Quantidade"
        data-testid={testIds.productQtyInput}
        onChange={(e) => handleInput(e.target.value)}
        className="h-11 w-12 rounded-none border-x border-y-0 border-[var(--store-border)] bg-transparent px-0 text-center text-sm font-semibold tabular-nums shadow-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Button
        type="button"
        surface="store"
        variant="ghost"
        aria-label="Aumentar quantidade"
        disabled={disabled || atMax}
        onClick={increment}
        className="min-h-11 min-w-11 rounded-none rounded-r-[var(--store-radius-pill)] px-0"
      >
        <PlusIcon className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
