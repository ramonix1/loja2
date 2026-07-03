'use client';

import { store as testIds } from '@lojao/test-utils/test-ids/store';
import Link from 'next/link';

import { Card } from '@lojao/ui';
import {
  storeHeadingClass,
  storeSectionTitleClass,
  storeSubtleClass,
} from '@/lib/store-styles';
import type { PublicCategory } from '@lojao/types/public-store';

interface CategoryGridProps {
  categorias: Pick<PublicCategory, 'id' | 'nome' | 'produtos'>[];
}

export function CategoryGrid({ categorias }: CategoryGridProps) {
  const visible = categorias.filter((cat) => cat.produtos.length > 0);
  if (visible.length === 0) return null;

  return (
    <section aria-label="Categorias populares" className="mb-10">
      <h2 className={storeSectionTitleClass('mb-4')}>Categorias populares</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {visible.map((cat) => (
          <Link
            key={cat.id}
            href={`#cat-${cat.id}`}
            data-testid={testIds.categoryPill(cat.id)}
            className="block"
          >
            <Card
              surface="store"
              className="flex min-h-[88px] flex-col justify-center p-4 shadow-sm transition hover:shadow-md"
            >
              <span className={storeHeadingClass('line-clamp-2 text-base')}>{cat.nome}</span>
              <span className={storeSubtleClass('mt-1 text-xs')}>
                {cat.produtos.length} {cat.produtos.length === 1 ? 'produto' : 'produtos'}
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
