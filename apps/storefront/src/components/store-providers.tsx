'use client';

import { StoreCartProvider } from '@/lib/store-cart-context';
import { StoreSearchProvider } from '@/lib/store-search-context';
import { StoreWishlistProvider } from '@/lib/store-wishlist-context';

export function StoreProviders({ children }: { children: React.ReactNode }) {
  return (
    <StoreSearchProvider>
      <StoreCartProvider>
        <StoreWishlistProvider>{children}</StoreWishlistProvider>
      </StoreCartProvider>
    </StoreSearchProvider>
  );
}
