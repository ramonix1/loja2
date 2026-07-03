import { buildStorePath } from '@lojao/store-host';
import Link from 'next/link';

import { storeLinkClass, storeSubtleClass } from '@/lib/store-styles';

export interface StoreBreadcrumbItem {
  label: string;
  href?: string;
}

interface StoreBreadcrumbsProps {
  storeSlug: string;
  items: StoreBreadcrumbItem[];
}

export function StoreBreadcrumbs({ storeSlug, items }: StoreBreadcrumbsProps) {
  const homeHref = buildStorePath(storeSlug);

  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href={homeHref} className={storeLinkClass('font-medium')}>
            Home
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              <span className={storeSubtleClass()} aria-hidden>
                /
              </span>
              {item.href && !isLast ? (
                <Link href={item.href} className={storeLinkClass('font-medium')}>
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-[var(--store-text)]" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
