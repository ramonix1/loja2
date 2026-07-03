'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface StoreSearchContextValue {
  query: string;
  setQuery: (query: string) => void;
  debouncedQuery: string;
}

const StoreSearchContext = createContext<StoreSearchContextValue | null>(null);

export function StoreSearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const value = useMemo(
    () => ({ query, setQuery, debouncedQuery }),
    [query, debouncedQuery],
  );

  return <StoreSearchContext.Provider value={value}>{children}</StoreSearchContext.Provider>;
}

export function useStoreSearch(): StoreSearchContextValue {
  const ctx = useContext(StoreSearchContext);
  if (!ctx) {
    throw new Error('useStoreSearch must be used within StoreSearchProvider');
  }
  return ctx;
}
