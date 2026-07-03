'use client';

import { store as testIds } from '@lojao/test-utils/test-ids/store';
import { useMemo, useState } from 'react';

import type { MockVariant } from '@/lib/product-variant-mock';
import { getMockVariants } from '@/lib/product-variant-mock';
import { storeMutedClass } from '@/lib/store-styles';

interface ProductVariantPickerProps {
  productId: number;
  productName: string;
  imageUrls?: string[];
  onSelect?: (variant: MockVariant | null) => void;
}

export function ProductVariantPicker({
  productId,
  productName,
  imageUrls = [],
  onSelect,
}: ProductVariantPickerProps) {
  const variants = useMemo(
    () => getMockVariants(productId, productName, imageUrls),
    [productId, productName, imageUrls],
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    variants[0]?.id ?? null,
  );

  if (variants.length === 0) return null;

  function select(variant: MockVariant) {
    setSelectedId(variant.id);
    onSelect?.(variant);
  }

  return (
    <div
      data-testid={testIds.productVariantPicker}
      aria-description="Seleção demonstrativa; não altera o pedido"
      className="space-y-2"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-[var(--store-text)]">Cor</span>
        <span className="rounded-[var(--store-radius-pill)] bg-[var(--store-badge-neutral-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--store-text-muted)]">
          Prévia
        </span>
      </div>
      <div className="flex flex-wrap gap-2" role="listbox" aria-label="Opções de cor">
        {variants.map((variant) => {
          const active = selectedId === variant.id;
          return (
            <button
              key={variant.id}
              type="button"
              role="option"
              aria-selected={active}
              aria-label={variant.label}
              data-testid={testIds.productVariant(variant.id)}
              title={variant.label}
              onClick={() => select(variant)}
              className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border-2 transition ${
                active
                  ? 'border-[var(--cor-primaria)] ring-2 ring-[var(--store-focus-ring)]'
                  : 'border-[var(--store-border)] hover:border-[var(--store-text-subtle)]'
              }`}
              style={
                variant.colorHex
                  ? { backgroundColor: variant.colorHex }
                  : { backgroundColor: 'var(--cor-primaria)' }
              }
            />
          );
        })}
      </div>
      <p className={storeMutedClass('text-xs')}>
        {variants.find((v) => v.id === selectedId)?.label ?? variants[0]?.label}
      </p>
    </div>
  );
}
