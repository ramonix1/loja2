'use client';

import { Button, FieldSelect, FieldSelectItem, Label } from '@lojao/ui';
import { store as testIds } from '@lojao/test-utils/test-ids/store';

import {
  type CategoryFilter,
  type HomeProductFilters,
  type PriceRangeFilter,
  type SortOption,
} from '@/lib/store-home-filters';
import { storeButtonPillClass } from '@/lib/store-styles';
import type { PublicCategory } from '@lojao/types/public-store';

interface ProductFiltersBarProps {
  categorias: Pick<PublicCategory, 'id' | 'nome' | 'produtos'>[];
  hasUncategorized: boolean;
  filters: HomeProductFilters;
  onChange: (filters: HomeProductFilters) => void;
}

const PRICE_OPTIONS: { value: PriceRangeFilter; label: string }[] = [
  { value: 'all', label: 'Todos os preços' },
  { value: 'under-100', label: 'Até R$ 100' },
  { value: '100-300', label: 'R$ 100 – 300' },
  { value: 'over-300', label: 'Acima de R$ 300' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'nome-asc', label: 'Nome (A–Z)' },
  { value: 'preco-asc', label: 'Menor preço' },
  { value: 'preco-desc', label: 'Maior preço' },
];

function FilterChip({
  active,
  label,
  testId,
  onClick,
}: {
  active: boolean;
  label: string;
  testId?: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      surface="store"
      variant={active ? 'primary' : 'secondary'}
      data-testid={testId}
      onClick={onClick}
      className={storeButtonPillClass(
        `shrink-0 px-4 py-2 text-sm font-medium ${active ? 'font-semibold' : ''}`,
      )}
    >
      {label}
    </Button>
  );
}

export function ProductFiltersBar({
  categorias,
  hasUncategorized,
  filters,
  onChange,
}: ProductFiltersBarProps) {
  function patch(partial: Partial<HomeProductFilters>) {
    onChange({ ...filters, ...partial });
  }

  const visibleCategories = categorias.filter((c) => c.produtos.length > 0);

  return (
    <div
      data-testid={testIds.homeFiltersBar}
      className="mb-8 space-y-3"
      aria-label="Filtros de produtos"
    >
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <FilterChip
          active={filters.categoryId === 'all'}
          label="Todas"
          testId={testIds.categoryPill('all')}
          onClick={() => patch({ categoryId: 'all' })}
        />
        {visibleCategories.map((cat) => (
          <FilterChip
            key={cat.id}
            active={filters.categoryId === cat.id}
            label={cat.nome}
            testId={testIds.categoryPill(cat.id)}
            onClick={() => patch({ categoryId: cat.id as CategoryFilter })}
          />
        ))}
        {hasUncategorized ? (
          <FilterChip
            active={filters.categoryId === 'outros'}
            label="Outros"
            testId={testIds.categoryPill('outros')}
            onClick={() => patch({ categoryId: 'outros' })}
          />
        ) : null}
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {PRICE_OPTIONS.map((opt) => (
          <FilterChip
            key={opt.value}
            active={filters.priceRange === opt.value}
            label={opt.label}
            onClick={() => patch({ priceRange: opt.value })}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Label
          htmlFor="store-filters-sort"
          className="shrink-0 text-sm font-medium text-[var(--store-text-muted)]"
        >
          Ordenar por
        </Label>
        <FieldSelect
          surface="store"
          id="store-filters-sort"
          data-testid={testIds.filtersSort}
          value={filters.sort}
          onValueChange={(sort) => patch({ sort: sort as SortOption })}
          triggerClassName={storeButtonPillClass('min-w-[11rem] justify-between')}
          contentClassName="rounded-[var(--store-radius-card)] border-[var(--store-border)]"
        >
          {SORT_OPTIONS.map((opt) => (
            <FieldSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </FieldSelectItem>
          ))}
        </FieldSelect>
      </div>
    </div>
  );
}
