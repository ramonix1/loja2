import { store as testIds } from '@lojao/test-utils/test-ids/store';
import type { Metadata } from 'next';
import { ProductPurchaseActions } from '@/components/product-purchase-actions';
import { ProductGallery } from '@/components/product-gallery';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  BRL,
  fetchPublicProductDetail,
  fetchPublicStore,
} from '@/lib/api';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const productId = Number(id);
  const [store, product] = await Promise.all([
    fetchPublicStore(),
    fetchPublicProductDetail(productId),
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
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId < 1) notFound();

  const [store, product] = await Promise.all([
    fetchPublicStore(),
    fetchPublicProductDetail(productId),
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
      <Link href="/" className="mb-6 inline-block text-sm text-blue-600 hover:underline">
        ← Voltar para loja
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={imagens} productName={product.nome} />

        <div className="flex flex-col gap-5">
          <div>
            <h1
              data-testid={testIds.productTitle}
              className="text-3xl font-extrabold text-gray-900"
            >
              {product.nome}
            </h1>
            {product.subtitulo ? (
              <p className="mt-2 text-lg text-gray-500">{product.subtitulo}</p>
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
            <p className="text-sm font-medium text-gray-600">
              {product.estoque <= 0
                ? 'Esgotado'
                : product.estoque <= 5
                  ? `Últimas ${product.estoque} unidades`
                  : `Em estoque (${product.estoque} un.)`}
            </p>
          ) : null}

          {product.descricao ? (
            <p className="leading-relaxed text-gray-700">{product.descricao}</p>
          ) : null}

          <ProductPurchaseActions produtoId={product.id} esgotado={esgotado} />
        </div>
      </div>
    </div>
  );
}
