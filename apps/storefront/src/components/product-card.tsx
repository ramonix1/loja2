import { buildStorePath } from '@lojao/store-host';
import { store as testIds } from '@lojao/test-utils/test-ids/store';
import { AddToCartButton } from '@/components/add-to-cart-button';
import { ProductRating } from '@/components/product-rating';
import { WishlistButton } from '@/components/wishlist-button';
import Link from 'next/link';

import { Badge, Card } from '@lojao/ui';
import { BRL, legacyAssetUrl } from '@/lib/api';
import {
  storeHeadingClass,
  storeImageWellClass,
  storePriceClass,
  storeSubtleClass,
} from '@/lib/store-styles';
import type { PublicProduct } from '@lojao/types/public-store';

interface ProductCardProps {
  product: PublicProduct;
  controlaEstoque: boolean;
  storeSlug: string;
}

export function ProductCard({ product, controlaEstoque, storeSlug }: ProductCardProps) {
  const esgotado =
    controlaEstoque &&
    product.estoque !== null &&
    product.estoque !== undefined &&
    product.estoque <= 0;

  const imgSrc =
    product.primeira_imagem != null
      ? legacyAssetUrl(product.primeira_imagem)
      : 'https://placehold.co/400x400/f3f4f6/9ca3af?text=Sem+Imagem';

  const productHref = buildStorePath(storeSlug, `/produto/${product.id}`);

  return (
    <Card
      surface="store"
      data-testid={testIds.homeProductCard(product.id)}
      className="flex flex-col overflow-hidden p-0 shadow-sm"
    >
      <div className="relative">
        <Link href={productHref} className="group block focus-visible:outline-none">
          <div className={storeImageWellClass('border-b border-[var(--store-border)]/50')}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt={product.nome}
              className="max-h-[86%] max-w-[86%] object-contain transition-transform duration-300 ease-out group-hover:scale-[1.03]"
              loading="lazy"
              decoding="async"
            />
          </div>
        </Link>
        <div className="absolute top-2 right-2 z-10">
          <WishlistButton productId={product.id} />
        </div>
        {esgotado ? (
          <>
            <div
              className="pointer-events-none absolute inset-0 bg-[var(--store-text)]/40"
              aria-hidden
            />
            <Badge
              variant="secondary"
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 text-xs font-semibold shadow-sm"
            >
              Esgotado
            </Badge>
          </>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link
          href={productHref}
          className="min-w-0 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--store-focus-ring)]"
        >
          <h2 className={storeHeadingClass('line-clamp-2 text-base leading-snug')}>
            {product.nome}
          </h2>
        </Link>
        <p className={storePriceClass('text-lg')}>{BRL.format(product.valor)}</p>

        {product.subtitulo ? (
          <p className={storeSubtleClass('line-clamp-2 text-sm')}>{product.subtitulo}</p>
        ) : null}

        {product.rating_summary && product.rating_summary.count > 0 ? (
          <ProductRating summary={product.rating_summary} compact />
        ) : null}

        <AddToCartButton
          produtoId={product.id}
          disabled={esgotado}
          className="mt-auto w-full text-sm"
          label="Adicionar ao carrinho"
        />
      </div>
    </Card>
  );
}
