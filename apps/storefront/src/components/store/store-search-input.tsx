'use client';

import { FieldInput } from '@lojao/ui';
import { store as testIds } from '@lojao/test-utils/test-ids/store';
import { ActionIcons } from '@lojao/ui/icons';

import { useStoreSearch } from '@/lib/store-search-context';
import { storeButtonPillClass } from '@/lib/store-styles';

interface StoreSearchInputProps {
  className?: string;
  /** Oculta em breakpoints menores quando há botão mobile separado. */
  compact?: boolean;
}

export function StoreSearchInput({ className, compact = false }: StoreSearchInputProps) {
  const { query, setQuery } = useStoreSearch();
  const SearchIcon = ActionIcons.search;

  return (
    <label
      className={
        compact
          ? `relative block w-full ${className ?? ''}`
          : `relative hidden min-w-0 flex-1 md:block ${className ?? ''}`
      }
    >
      <span className="sr-only">Buscar produtos</span>
      <SearchIcon
        className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--store-text-subtle)]"
        aria-hidden
      />
      <FieldInput
        surface="store"
        type="text"
        role="searchbox"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar produtos…"
        data-testid={testIds.headerSearch}
        className={storeButtonPillClass('min-h-11 w-full py-2.5 pl-11 pr-4 text-sm')}
      />
    </label>
  );
}
