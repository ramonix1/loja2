import { ProductCard } from '@/components/product-card';
import { storeSectionTitleClass } from '@/lib/store-styles';
import type { PublicProduct } from '@lojao/types/public-store';

interface ProductGridProps {
  products: PublicProduct[];
  controlaEstoque: boolean;
  storeSlug: string;
  title?: string;
}

export function ProductGrid({ products, controlaEstoque, storeSlug, title }: ProductGridProps) {
  if (products.length === 0) return null;

  return (
    <section className="mb-12">
      {title ? <h2 className={storeSectionTitleClass('mb-6')}>{title}</h2> : null}
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
    </section>
  );
}
