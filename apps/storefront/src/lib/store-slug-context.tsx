'use client';

import { createContext, useContext, useEffect } from 'react';

import { setClientStoreSlug } from '@/lib/client-api';

const StoreSlugContext = createContext<string>('loja');

export function StoreSlugProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  // Sincroniza antes dos filhos montarem — evita fetch com slug default `loja`.
  setClientStoreSlug(slug);

  useEffect(() => {
    setClientStoreSlug(slug);
  }, [slug]);

  return <StoreSlugContext.Provider value={slug}>{children}</StoreSlugContext.Provider>;
}

export function useStoreSlug(): string {
  return useContext(StoreSlugContext);
}
