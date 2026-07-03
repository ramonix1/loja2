'use client';

import { store as testIds } from '@lojao/test-utils/test-ids/store';
import type { ProductRatingSummary } from '@lojao/types/reviews';

import { storeMutedClass } from '@/lib/store-styles';

interface ProductRatingProps {
  summary: ProductRatingSummary;
  compact?: boolean;
  className?: string;
}

function StarGlyph({ filled, partial }: { filled: boolean; partial?: boolean }) {
  return (
    <span
      className={`inline-block leading-none ${filled ? 'text-amber-500' : partial ? 'text-amber-300' : 'text-[var(--store-border)]'}`}
      aria-hidden
    >
      ★
    </span>
  );
}

function renderStars(average: number) {
  return Array.from({ length: 5 }, (_, index) => {
    const starValue = index + 1;
    const filled = average >= starValue;
    const partial = !filled && average > index && average < starValue;
    return <StarGlyph key={starValue} filled={filled} partial={partial} />;
  });
}

export function ProductRating({ summary, compact = false, className = '' }: ProductRatingProps) {
  if (summary.count <= 0) return null;

  return (
    <div
      data-testid={testIds.productRating}
      className={`flex flex-wrap items-center gap-1.5 ${className}`}
      aria-label={`Nota ${summary.average} de 5, ${summary.count} avaliações`}
    >
      <span className={`inline-flex gap-0.5 ${compact ? 'text-sm' : 'text-base'}`}>
        {renderStars(summary.average)}
      </span>
      <span className={storeMutedClass(compact ? 'text-xs' : 'text-sm')}>
        {summary.average.toFixed(1)} ({summary.count})
      </span>
    </div>
  );
}
