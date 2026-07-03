'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  addWishlistItem,
  fetchWishlistCount,
  fetchWishlistIds,
  removeWishlistItem,
} from '@/lib/client-api';
import { useStoreSlug } from '@/lib/store-slug-context';

interface StoreWishlistContextValue {
  ids: Set<number>;
  count: number;
  isWishlisted: (productId: number) => boolean;
  refresh: () => Promise<void>;
  toggle: (productId: number) => Promise<boolean>;
}

const StoreWishlistContext = createContext<StoreWishlistContextValue | null>(null);

export function StoreWishlistProvider({ children }: { children: React.ReactNode }) {
  const storeSlug = useStoreSlug();
  const [ids, setIds] = useState<number[]>([]);
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const [nextIds, nextCount] = await Promise.all([fetchWishlistIds(), fetchWishlistCount()]);
    setIds(nextIds);
    setCount(nextCount);
  }, []);

  useEffect(() => {
    setIds([]);
    setCount(0);
    void refresh();
  }, [refresh, storeSlug]);

  const idSet = useMemo(() => new Set(ids), [ids]);

  const toggle = useCallback(
    async (productId: number): Promise<boolean> => {
      const wasWishlisted = idSet.has(productId);
      if (wasWishlisted) {
        await removeWishlistItem(productId);
      } else {
        await addWishlistItem(productId);
      }
      await refresh();
      return !wasWishlisted;
    },
    [idSet, refresh],
  );

  const value = useMemo(
    () => ({
      ids: idSet,
      count,
      isWishlisted: (productId: number) => idSet.has(productId),
      refresh,
      toggle,
    }),
    [idSet, count, refresh, toggle],
  );

  return (
    <StoreWishlistContext.Provider value={value}>{children}</StoreWishlistContext.Provider>
  );
}

export function useStoreWishlist(): StoreWishlistContextValue {
  const ctx = useContext(StoreWishlistContext);
  if (!ctx) {
    throw new Error('useStoreWishlist must be used within StoreWishlistProvider');
  }
  return ctx;
}

export function useStoreWishlistOptional(): StoreWishlistContextValue | null {
  return useContext(StoreWishlistContext);
}
