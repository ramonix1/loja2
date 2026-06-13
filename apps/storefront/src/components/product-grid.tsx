import { ProductCard } from '@/components/product-card';
import type { PublicProduct } from '@lojao/types/public-store';

interface ProductGridProps {
  products: PublicProduct[];
  controlaEstoque: boolean;
  title?: string;
}

export function ProductGrid({ products, controlaEstoque, title }: ProductGridProps) {
  if (products.length === 0) return null;

  return (
    <section className="mb-12">
      {title ? <h2 className="mb-6 text-2xl font-bold text-gray-900">{title}</h2> : null}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} controlaEstoque={controlaEstoque} />
        ))}
      </div>
    </section>
  );
}
