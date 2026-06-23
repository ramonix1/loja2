'use client';

import { createContext, useContext, useEffect } from 'react';

import { setClientTenantSlug } from '@/lib/client-api';

const StoreSlugContext = createContext<string>('loja');

export function StoreSlugProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    setClientTenantSlug(slug);
  }, [slug]);

  return <StoreSlugContext.Provider value={slug}>{children}</StoreSlugContext.Provider>;
}

export function useStoreSlug(): string {
  return useContext(StoreSlugContext);
}
