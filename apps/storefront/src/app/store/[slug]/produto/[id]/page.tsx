import { store as testIds } from '@lojao/test-utils/test-ids/store';
import { buildStorePath } from '@lojao/tenant-host';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ProductGallery } from '@/components/product-gallery';
import { ProductPurchaseActions } from '@/components/product-purchase-actions';
import {
  BRL,
  fetchPublicProductDetail,
  fetchPublicStore,
} from '@/lib/api';
import {
  storeBodyClass,
  storeLinkClass,
  storeMutedClass,
  storePageTitleClass,
} from '@/lib/store-styles';

export const revalidate = 60;

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

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug, id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId < 1) notFound();

  const [store, product] = await Promise.all([
    fetchPublicStore(slug),
    fetchPublicProductDetail(slug, productId),
  ]);

  if (!product) notFound();

  const imagens =
    product.imagens.length > 0
      ? product.imagens
      : product.primeira_imagem
        ? [{ id: 0, url: product.primeira_imagem }]
        : [];

  const esgotado =
    store.controla_estoque &&
    product.estoque !== null &&
    product.estoque !== undefined &&
    product.estoque <= 0;

  return (
    <div data-testid={testIds.productDetail}>
      <Link href={buildStorePath(slug)} className={storeLinkClass('mb-6 inline-block text-sm')}>
        ← Voltar para loja
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={imagens} productName={product.nome} />

        <div className="flex flex-col gap-5">
          <div>
            <h1 data-testid={testIds.productTitle} className={storePageTitleClass()}>
              {product.nome}
            </h1>
            {product.subtitulo ? (
              <p className={storeMutedClass('mt-2 text-lg')}>{product.subtitulo}</p>
            ) : null}
          </div>

          <p
            data-testid={testIds.productPrice}
            className="text-4xl font-black"
            style={{ color: 'var(--cor-primaria)' }}
          >
            {BRL.format(product.valor)}
          </p>

          {store.controla_estoque && product.estoque != null ? (
            <p className={storeMutedClass('text-sm font-medium')}>
              {product.estoque <= 0
                ? 'Esgotado'
                : product.estoque <= 5
                  ? `Últimas ${product.estoque} unidades`
                  : `Em estoque (${product.estoque} un.)`}
            </p>
          ) : null}

          {product.descricao ? (
            <p className={storeBodyClass('leading-relaxed')}>{product.descricao}</p>
          ) : null}

          <ProductPurchaseActions produtoId={product.id} esgotado={esgotado} />
        </div>
      </div>
    </div>
  );
}
