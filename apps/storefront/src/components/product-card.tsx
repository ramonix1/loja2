import { buildStorePath } from '@lojao/tenant-host';
import { store as testIds } from '@lojao/test-utils/test-ids/store';
import { AddToCartButton } from '@/components/add-to-cart-button';
import Link from 'next/link';

import { BRL, legacyAssetUrl } from '@/lib/api';
import {
  storeCardClass,
  storeErrorTextClass,
  storeHeadingClass,
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
      : 'https://placehold.co/400x220/eee/aaa?text=Sem+Imagem';

  const productHref = buildStorePath(storeSlug, `/produto/${product.id}`);

  return (
    <article
      data-testid={testIds.homeProductCard(product.id)}
      className={storeCardClass('flex flex-col overflow-hidden shadow-sm transition hover:shadow-md')}
    >
      <Link href={productHref} className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={product.nome}
          className="aspect-[4/3] w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="p-4">
          <h2 className={storeHeadingClass()}>{product.nome}</h2>
          {product.subtitulo ? (
            <p className={storeSubtleClass('mt-1 line-clamp-2 text-sm')}>{product.subtitulo}</p>
          ) : null}
          <p className="mt-3 text-xl font-black" style={{ color: 'var(--cor-primaria)' }}>
            {BRL.format(product.valor)}
          </p>
          {esgotado ? (
            <p className={storeErrorTextClass('mt-2 text-xs font-semibold')}>Esgotado</p>
          ) : null}
        </div>
      </Link>
      <div className="mt-auto flex gap-2 border-t border-[var(--store-border)] p-4 pt-0">
        <Link href={productHref} className="btn-outline flex-1 text-center text-xs">
          Ver detalhes
        </Link>
        <AddToCartButton
          produtoId={product.id}
          disabled={esgotado}
          className="btn-primary flex-1 text-xs"
          label="Adicionar"
        />
      </div>
    </article>
  );
}
