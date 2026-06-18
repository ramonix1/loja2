import { store as testIds } from '@lojao/test-utils/test-ids/store';
import type { Metadata } from 'next';

import { BannerCarousel } from '@/components/banner-carousel';
import { ProductGrid } from '@/components/product-grid';
import { buildStoreMetadata, fetchPublicBanners, fetchPublicStore, flattenStoreProducts } from '@/lib/api';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const store = await fetchPublicStore();
  return buildStoreMetadata(store);
}

export default async function HomePage() {
  const [store, banners] = await Promise.all([fetchPublicStore(), fetchPublicBanners()]);
  const allProducts = flattenStoreProducts(store);

  return (
    <div>
      <BannerCarousel banners={banners} />

      <section id="produtos" className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          {store.loja.nome}
        </h1>
        {store.loja.slogan ? (
          <p className="mt-2 text-lg text-gray-600">{store.loja.slogan}</p>
        ) : null}
      </section>

      <div data-testid={testIds.homeProductGrid}>
        {store.categorias.map((cat) => (
          <ProductGrid
            key={cat.id}
            title={cat.nome}
            products={cat.produtos}
            controlaEstoque={store.controla_estoque}
          />
        ))}

        {store.produtos_sem_categoria.length > 0 ? (
          <ProductGrid
            title="Outros produtos"
            products={store.produtos_sem_categoria}
            controlaEstoque={store.controla_estoque}
          />
        ) : null}
      </div>

      {allProducts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
          Nenhum produto cadastrado ainda.
        </p>
      ) : null}
    </div>
  );
}
