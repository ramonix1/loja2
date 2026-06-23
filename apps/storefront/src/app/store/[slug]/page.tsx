import { store as testIds } from '@lojao/test-utils/test-ids/store';
import type { Metadata } from 'next';

import { BannerCarousel } from '@/components/banner-carousel';
import { ProductGrid } from '@/components/product-grid';
import { buildStoreMetadata, fetchPublicBanners, fetchPublicStore, flattenStoreProducts } from '@/lib/api';
import { storeEmptyStateClass, storeMutedClass, storePageTitleClass } from '@/lib/store-styles';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await fetchPublicStore(slug);
  return buildStoreMetadata(store, slug);
}

export default async function StoreHomePage({ params }: PageProps) {
  const { slug } = await params;
  const [store, banners] = await Promise.all([fetchPublicStore(slug), fetchPublicBanners(slug)]);
  const allProducts = flattenStoreProducts(store);

  return (
    <div>
      <BannerCarousel banners={banners} storeSlug={slug} />

      <section id="produtos" className="mb-10">
        <h1 className={storePageTitleClass('tracking-tight')}>{store.loja.nome}</h1>
        {store.loja.slogan ? (
          <p className={storeMutedClass('mt-2 text-lg')}>{store.loja.slogan}</p>
        ) : null}
      </section>

      <div data-testid={testIds.homeProductGrid}>
        {store.categorias.map((cat) => (
          <ProductGrid
            key={cat.id}
            title={cat.nome}
            products={cat.produtos}
            controlaEstoque={store.controla_estoque}
            storeSlug={slug}
          />
        ))}

        {store.produtos_sem_categoria.length > 0 ? (
          <ProductGrid
            title="Outros produtos"
            products={store.produtos_sem_categoria}
            controlaEstoque={store.controla_estoque}
            storeSlug={slug}
          />
        ) : null}
      </div>

      {allProducts.length === 0 ? (
        <p className={storeEmptyStateClass('p-12')}>Nenhum produto cadastrado ainda.</p>
      ) : null}
    </div>
  );
}
