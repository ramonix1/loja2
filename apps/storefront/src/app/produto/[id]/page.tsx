import { store as testIds } from '@lojao/test-utils/test-ids/store';
import type { Metadata } from 'next';
import { ProductPurchaseActions } from '@/components/product-purchase-actions';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  BRL,
  fetchPublicProductDetail,
  fetchPublicStore,
  legacyAssetUrl,
} from '@/lib/api';

export const dynamic = 'force-dynamic';

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

  const mainImage =
    imagens[0]?.url != null
      ? legacyAssetUrl(imagens[0].url)
      : 'https://placehold.co/600x450/f3f4f6/9ca3af?text=Sem+Imagem';

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
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mainImage}
            alt={product.nome}
            className="w-full rounded-xl object-cover shadow-sm"
            style={{ maxHeight: 460 }}
          />
          {imagens.length > 1 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {imagens.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={legacyAssetUrl(img.url)}
                  alt=""
                  className="h-16 w-16 rounded-lg border border-gray-200 object-cover"
                />
              ))}
            </div>
          ) : null}
        </div>

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
