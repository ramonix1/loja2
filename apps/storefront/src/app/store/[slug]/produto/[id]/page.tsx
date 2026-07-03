import { buildStorePath } from '@lojao/store-host';
import { store as testIds } from '@lojao/test-utils/test-ids/store';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ProductGrid } from '@/components/product-grid';
import { ProductRating } from '@/components/product-rating';
import { ProductReviews } from '@/components/product-reviews';
import { WishlistButton } from '@/components/wishlist-button';
import { ProductDescription } from '@/components/store/product-description';
import { ProductPdpGallery } from '@/components/store/product-pdp-gallery';
import { StoreBreadcrumbs } from '@/components/store/store-breadcrumbs';
import { ProductPurchaseActions } from '@/components/product-purchase-actions';
import {
  BRL,
  fetchPublicProductDetail,
  fetchPublicStore,
} from '@/lib/api';
import {
  storeMutedClass,
  storePageTitleClass,
  storePriceClass,
  storeWarningClass,
} from '@/lib/store-styles';
import type { PublicProduct, PublicStoreData } from '@lojao/types/public-store';

export const revalidate = 30;

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, id } = await params;
  const productId = Number(id);
  const [store, product] = await Promise.all([
    fetchPublicStore(slug),
    fetchPublicProductDetail(slug, productId),
  ]);

  if (!product) {
    return { title: 'Produto não encontrado' };
  }

  return {
    title: product.nome,
    description:
      product.subtitulo ??
      product.descricao?.slice(0, 160) ??
      `${product.nome} — ${store.loja.nome}`,
    openGraph: {
      title: product.nome,
      description: product.subtitulo ?? store.loja.slogan,
    },
  };
}

function getCategory(store: PublicStoreData, categoriaId: number | null) {
  if (categoriaId == null) return null;
  return store.categorias.find((c) => c.id === categoriaId) ?? null;
}

function getRelatedProducts(
  store: PublicStoreData,
  productId: number,
  categoriaId: number | null,
  limit = 8,
): PublicProduct[] {
  if (categoriaId == null) return [];
  const category = store.categorias.find((c) => c.id === categoriaId);
  if (!category) return [];
  return category.produtos.filter((p) => p.id !== productId).slice(0, limit);
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug, id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId < 1) notFound();

  const [store, product] = await Promise.all([
    fetchPublicStore(slug),
    fetchPublicProductDetail(slug, productId),
  ]);

  if (!product) notFound();

  const category = getCategory(store, product.categoria_id);
  const related = getRelatedProducts(store, product.id, product.categoria_id);

  const imagens =
    product.imagens.length > 0
      ? product.imagens
      : product.primeira_imagem
        ? [{ id: 0, url: product.primeira_imagem }]
        : [];

  const imageUrls = imagens.map((img) => img.url);

  const esgotado =
    store.controla_estoque &&
    product.estoque !== null &&
    product.estoque !== undefined &&
    product.estoque <= 0;

  const lowStock =
    store.controla_estoque &&
    product.estoque != null &&
    product.estoque > 0 &&
    product.estoque <= 5;

  const maxQty =
    store.controla_estoque && product.estoque != null && product.estoque > 0
      ? product.estoque
      : undefined;

  const homeHref = buildStorePath(slug);
  const breadcrumbItems = [
    ...(category
      ? [{ label: category.nome, href: `${homeHref}#cat-${category.id}` }]
      : []),
    { label: product.nome },
  ];

  return (
    <div data-testid={testIds.productDetail}>
      <StoreBreadcrumbs storeSlug={slug} items={breadcrumbItems} />

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="relative">
          <ProductPdpGallery
            images={imagens}
            productName={product.nome}
            productId={product.id}
            imageUrls={imageUrls}
          />
          <div className="absolute top-3 right-3 z-10">
            <WishlistButton productId={product.id} />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <h1 data-testid={testIds.productTitle} className={storePageTitleClass()}>
              {product.nome}
            </h1>
            {product.subtitulo ? (
              <p className={storeMutedClass('mt-2 text-lg')}>{product.subtitulo}</p>
            ) : null}
            {product.rating_summary && product.rating_summary.count > 0 ? (
              <div className="mt-3">
                <ProductRating summary={product.rating_summary} />
                <a href="#avaliacoes" className={storeMutedClass('ml-2 text-sm underline')}>
                  Ver {product.rating_summary.count} avaliações
                </a>
              </div>
            ) : null}
          </div>

          <div>
            <p data-testid={testIds.productPrice} className={storePriceClass('text-3xl sm:text-4xl')}>
              {BRL.format(product.valor)}
            </p>
            {product.subtitulo ? (
              <p className={storeMutedClass('mt-1 text-sm')}>Preço à vista</p>
            ) : null}
          </div>

          {lowStock ? (
            <p className={storeWarningClass('text-sm font-semibold')}>
              Restam apenas {product.estoque} unidades!
            </p>
          ) : null}

          {store.controla_estoque && product.estoque != null && product.estoque <= 0 ? (
            <p className={storeMutedClass('text-sm font-semibold')}>Esgotado</p>
          ) : null}

          {store.controla_estoque &&
          product.estoque != null &&
          product.estoque > 5 ? (
            <p className={storeMutedClass('text-sm font-medium')}>
              Em estoque ({product.estoque} un.)
            </p>
          ) : null}

          <ProductPurchaseActions
            produtoId={product.id}
            esgotado={esgotado}
            maxQuantidade={maxQty}
          />

          {product.descricao ? <ProductDescription description={product.descricao} /> : null}

          <ProductReviews productId={product.id} />
        </div>
      </div>

      {related.length > 0 ? (
        <section data-testid={testIds.productRelated} className="mt-16 border-t border-[var(--store-border)] pt-12">
          <ProductGrid
            title="Produtos similares"
            sectionHeading={false}
            products={related}
            controlaEstoque={store.controla_estoque}
            storeSlug={slug}
            layout="carousel"
          />
        </section>
      ) : null}
    </div>
  );
}
