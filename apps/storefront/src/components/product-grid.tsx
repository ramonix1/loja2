import { ProductCard } from '@/components/product-card';
import { HOME_CAROUSEL_THRESHOLD } from '@/lib/store-home-filters';
import { storeSectionTitleClass } from '@/lib/store-styles';
import { Button } from '@lojao/ui';
import { store as testIds } from '@lojao/test-utils/test-ids/store';
import type { PublicProduct } from '@lojao/types/public-store';

interface ProductGridProps {
  products: PublicProduct[];
  controlaEstoque: boolean;
  storeSlug: string;
  title?: string;
  sectionId?: string;
  /** Se false, usa `title` literal (sem sufixo "para você"). */
  sectionHeading?: boolean;
  /** Grid padrão ou carrossel horizontal com snap. */
  layout?: 'grid' | 'carousel';
  /** Força layout grid (ex.: após "Ver todos"). */
  forceGrid?: boolean;
  onViewAll?: () => void;
}

export function ProductGrid({
  products,
  controlaEstoque,
  storeSlug,
  title,
  sectionId,
  sectionHeading = true,
  layout = 'grid',
  forceGrid = false,
  onViewAll,
}: ProductGridProps) {
  if (products.length === 0) return null;

  const useCarousel =
    !forceGrid && layout === 'carousel' && products.length > HOME_CAROUSEL_THRESHOLD;
  const showViewAll = useCarousel && onViewAll != null;

  const sectionTitle = title
    ? sectionHeading
      ? `${title} para você`
      : title
    : undefined;

  return (
    <section id={sectionId} className="mb-12 scroll-mt-24">
      {sectionTitle ? (
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className={storeSectionTitleClass()}>{sectionTitle}</h2>
          {showViewAll ? (
            <Button
              type="button"
              surface="store"
              variant="ghost"
              data-testid={testIds.sectionViewAll(sectionId ?? 'default')}
              onClick={onViewAll}
              className="shrink-0 text-sm font-semibold text-[var(--store-link)] hover:text-[var(--store-link)] hover:underline"
            >
              Ver todos
            </Button>
          ) : null}
        </div>
      ) : null}

      {useCarousel ? (
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
          {products.map((product) => (
            <div
              key={product.id}
              className="w-[min(72vw,280px)] shrink-0 snap-start sm:w-[280px]"
            >
              <ProductCard
                product={product}
                controlaEstoque={controlaEstoque}
                storeSlug={storeSlug}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              controlaEstoque={controlaEstoque}
              storeSlug={storeSlug}
            />
          ))}
        </div>
      )}
    </section>
  );
}
