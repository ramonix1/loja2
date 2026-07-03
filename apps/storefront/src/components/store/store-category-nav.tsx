'use client';

import { buildStorePath } from '@lojao/store-host';
import { store as testIds } from '@lojao/test-utils/test-ids/store';
import Link from 'next/link';

import { storeShellClasses } from '@/lib/store-styles';
import type { PublicCategory } from '@lojao/types/public-store';

interface StoreCategoryNavProps {
  categorias: Pick<PublicCategory, 'id' | 'nome'>[];
  storeSlug: string;
  className?: string;
  onNavigate?: () => void;
  /** Menu mobile empilhado. */
  stacked?: boolean;
}

export function StoreCategoryNav({
  categorias,
  storeSlug,
  className,
  onNavigate,
  stacked = false,
}: StoreCategoryNavProps) {
  if (categorias.length === 0) return null;

  const homeHref = buildStorePath(storeSlug);
  const navLink = storeShellClasses().navLink;

  return (
    <nav
      aria-label="Categorias"
      className={
        stacked
          ? `flex flex-col gap-1 ${className ?? ''}`
          : `hidden items-center gap-1 lg:flex ${className ?? ''}`
      }
    >
      {categorias.map((cat) => (
        <Link
          key={cat.id}
          href={`${homeHref}#cat-${cat.id}`}
          data-testid={testIds.headerCategory(cat.id)}
          onClick={onNavigate}
          className={
            stacked
              ? `${navLink} flex min-h-12 items-center rounded-lg px-3 py-2.5 text-base font-medium`
              : `${navLink} rounded-[var(--store-radius-pill)] px-3 py-2 text-sm font-medium whitespace-nowrap`
          }
        >
          {cat.nome}
        </Link>
      ))}
    </nav>
  );
}
