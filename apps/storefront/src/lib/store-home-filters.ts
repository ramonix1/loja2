import type { PublicProduct } from '@lojao/types/public-store';

export type PriceRangeFilter = 'all' | 'under-100' | '100-300' | 'over-300';
export type SortOption = 'nome-asc' | 'preco-asc' | 'preco-desc';
export type CategoryFilter = 'all' | 'outros' | number;

export interface HomeProductFilters {
  categoryId: CategoryFilter;
  priceRange: PriceRangeFilter;
  sort: SortOption;
}

export const DEFAULT_HOME_FILTERS: HomeProductFilters = {
  categoryId: 'all',
  priceRange: 'all',
  sort: 'nome-asc',
};

/** Mínimo de produtos para carrossel + link "Ver todos". */
export const HOME_CAROUSEL_THRESHOLD = 4;

export function matchesPriceRange(product: PublicProduct, range: PriceRangeFilter): boolean {
  switch (range) {
    case 'all':
      return true;
    case 'under-100':
      return product.valor < 100;
    case '100-300':
      return product.valor >= 100 && product.valor <= 300;
    case 'over-300':
      return product.valor > 300;
  }
}

export function sortProducts(products: PublicProduct[], sort: SortOption): PublicProduct[] {
  const copy = [...products];
  switch (sort) {
    case 'nome-asc':
      return copy.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    case 'preco-asc':
      return copy.sort((a, b) => a.valor - b.valor);
    case 'preco-desc':
      return copy.sort((a, b) => b.valor - a.valor);
    default:
      return copy;
  }
}

export function filterProducts(
  products: PublicProduct[],
  filters: HomeProductFilters,
): PublicProduct[] {
  const filtered = products.filter((p) => matchesPriceRange(p, filters.priceRange));
  return sortProducts(filtered, filters.sort);
}
