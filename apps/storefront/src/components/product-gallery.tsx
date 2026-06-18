'use client';

import { store as testIds } from '@lojao/test-utils/test-ids/store';
import { useState } from 'react';

import { legacyAssetUrl } from '@/lib/api';

const PLACEHOLDER =
  'https://placehold.co/600x450/f3f4f6/9ca3af?text=Sem+Imagem';

export interface ProductGalleryImage {
  id: number;
  url: string;
}

interface ProductGalleryProps {
  images: ProductGalleryImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = images.length > 0 ? Math.min(activeIndex, images.length - 1) : 0;
  const main = images[safeIndex];
  const mainSrc = main ? legacyAssetUrl(main.url) : PLACEHOLDER;

  return (
    <div data-testid={testIds.productGallery}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mainSrc}
        alt={productName}
        className="w-full rounded-xl object-cover shadow-sm"
        style={{ maxHeight: 460 }}
        decoding="async"
        fetchPriority="high"
      />
      {images.length > 1 ? (
        <div className="mt-4 flex flex-wrap gap-2" role="list" aria-label="Miniaturas do produto">
          {images.map((img, index) => {
            const selected = index === safeIndex;
            return (
              <button
                key={img.id}
                type="button"
                role="listitem"
                aria-label={`Ver imagem ${index + 1} de ${images.length}`}
                aria-pressed={selected}
                data-testid={testIds.productGalleryThumb(img.id)}
                onClick={() => setActiveIndex(index)}
                className={`overflow-hidden rounded-lg border-2 transition ${
                  selected
                    ? 'border-[var(--cor-primaria)] ring-2 ring-[var(--cor-primaria)]/30'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={legacyAssetUrl(img.url)}
                  alt=""
                  className="h-16 w-16 object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
