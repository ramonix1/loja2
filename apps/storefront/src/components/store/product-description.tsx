'use client';

import { useState } from 'react';

import { storeBodyClass, storeLinkClass } from '@/lib/store-styles';

interface ProductDescriptionProps {
  description: string;
}

export function ProductDescription({ description }: ProductDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = description.length > 220;

  return (
    <div className="border-t border-[var(--store-border)] pt-5">
      <h2 className="mb-3 text-lg font-bold text-[var(--store-text)]">Descrição</h2>
      <div
        className={`prose prose-sm max-w-none text-[var(--store-text)] ${!expanded && isLong ? 'line-clamp-4 md:line-clamp-none' : ''}`}
      >
        <p className={storeBodyClass('leading-relaxed whitespace-pre-line')}>{description}</p>
      </div>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={storeLinkClass('mt-2 text-sm font-semibold md:hidden')}
        >
          {expanded ? 'Ver menos' : 'Ver mais'}
        </button>
      ) : null}
    </div>
  );
}
