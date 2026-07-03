'use client';

import { BannerCarousel } from '@/components/banner-carousel';
import { ProductGrid } from '@/components/product-grid';
import { CategoryGrid } from '@/components/store/category-grid';
import { ProductFiltersBar } from '@/components/store/product-filters-bar';
import { storeEmptyStateClass } from '@/lib/store-styles';
import {
  DEFAULT_HOME_FILTERS,
  filterProducts,
  type HomeProductFilters,
} from '@/lib/store-home-filters';
import { useStoreSearch } from '@/lib/store-search-context';
import type { PublicBanner, PublicProduct, PublicStoreData } from '@lojao/types/public-store';
import { store as testIds } from '@lojao/test-utils/test-ids/store';
import { useMemo, useState } from 'react';

interface StoreHomeClientProps {
  store: PublicStoreData;
  banners: PublicBanner[];
  storeSlug: string;
}

function matchesQuery(
  product: { nome: string; subtitulo: string | null },
  query: string,
): boolean {
  if (!query) return true;
  const haystack = `${product.nome} ${product.subtitulo ?? ''}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function applyQueryAndFilters(
  products: PublicProduct[],
  query: string,
  filters: HomeProductFilters,
): PublicProduct[] {
  const searched = products.filter((p) => matchesQuery(p, query));
  return filterProducts(searched, filters);
}

export function StoreHomeClient({ store, banners, storeSlug }: StoreHomeClientProps) {
  const { debouncedQuery } = useStoreSearch();
  const [filters, setFilters] = useState<HomeProductFilters>(DEFAULT_HOME_FILTERS);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set());

  const hasSearch = debouncedQuery.length > 0;
  const hasUncategorized = store.produtos_sem_categoria.length > 0;

  const categoriasForNav = useMemo(
    () =>
      store.categorias.map((cat) => ({
        ...cat,
        produtos: cat.produtos.filter((p) => matchesQuery(p, debouncedQuery)),
      })),
    [store.categorias, debouncedQuery],
  );

  const categorias = useMemo(() => {
    return categoriasForNav
      .map((cat) => ({
        ...cat,
        produtos: applyQueryAndFilters(cat.produtos, debouncedQuery, filters),
      }))
      .filter((cat) => {
        if (hasSearch && cat.produtos.length === 0) return false;
        if (filters.categoryId === 'all') return true;
        if (filters.categoryId === 'outros') return false;
        return cat.id === filters.categoryId;
      });
  }, [categoriasForNav, debouncedQuery, filters, hasSearch]);

  const produtosSemCategoria = useMemo(() => {
    if (filters.categoryId !== 'all' && filters.categoryId !== 'outros') return [];
    return applyQueryAndFilters(store.produtos_sem_categoria, debouncedQuery, filters);
  }, [store.produtos_sem_categoria, debouncedQuery, filters]);

  const totalVisible =
    categorias.reduce((sum, cat) => sum + cat.produtos.length, 0) +
    produtosSemCategoria.length;

  const allProductsEmpty =
    store.categorias.every((c) => c.produtos.length === 0) &&
    store.produtos_sem_categoria.length === 0;

  function expandSection(sectionKey: string) {
    setExpandedSections((prev) => new Set(prev).add(sectionKey));
  }

  return (
    <div>
      <BannerCarousel banners={banners} storeSlug={storeSlug} variant="light" />

      {!allProductsEmpty ? (
        <>
          <CategoryGrid categorias={categoriasForNav.filter((c) => c.produtos.length > 0)} />
          <ProductFiltersBar
            categorias={categoriasForNav}
            hasUncategorized={hasUncategorized}
            filters={filters}
            onChange={setFilters}
          />
        </>
      ) : null}

      <div id="produtos" data-testid={testIds.homeProductGrid}>
        {hasSearch && totalVisible === 0 ? (
          <p className={storeEmptyStateClass('p-8')}>
            Nenhum produto encontrado para &ldquo;{debouncedQuery}&rdquo;.
          </p>
        ) : null}

        {!hasSearch && totalVisible === 0 && !allProductsEmpty ? (
          <p className={storeEmptyStateClass('p-8')}>
            Nenhum produto corresponde aos filtros selecionados.
          </p>
        ) : null}

        {categorias.map((cat) => {
          const sectionKey = `cat-${cat.id}`;
          return (
            <ProductGrid
              key={cat.id}
              sectionId={sectionKey}
              title={cat.nome}
              products={cat.produtos}
              controlaEstoque={store.controla_estoque}
              storeSlug={storeSlug}
              layout="carousel"
              forceGrid={expandedSections.has(sectionKey)}
              onViewAll={() => expandSection(sectionKey)}
            />
          );
        })}

        {produtosSemCategoria.length > 0 ? (
          <ProductGrid
            sectionId="cat-outros"
            title="Outros produtos"
            products={produtosSemCategoria}
            controlaEstoque={store.controla_estoque}
            storeSlug={storeSlug}
            layout="carousel"
            forceGrid={expandedSections.has('cat-outros')}
            onViewAll={() => expandSection('cat-outros')}
          />
        ) : null}
      </div>

      {allProductsEmpty ? (
        <p className={storeEmptyStateClass('p-12')}>Nenhum produto cadastrado ainda.</p>
      ) : null}
    </div>
  );
}
