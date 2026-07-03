'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { AddToCartToast } from '@/components/store/add-to-cart-toast';
import { fetchCartCount } from '@/lib/client-api';
import { useStoreSlug } from '@/lib/store-slug-context';
import { useStoreHref } from '@/lib/use-store-href';

interface StoreCartContextValue {
  count: number;
  refreshCount: () => Promise<void>;
  notifyAdded: () => void;
}

const StoreCartContext = createContext<StoreCartContextValue | null>(null);

export function StoreCartProvider({ children }: { children: React.ReactNode }) {
  const storeSlug = useStoreSlug();
  const [count, setCount] = useState(0);
  const [toastOpen, setToastOpen] = useState(false);
  const cartHref = useStoreHref('/cart');

  const refreshCount = useCallback(async () => {
    const next = await fetchCartCount();
    setCount(next);
  }, []);

  useEffect(() => {
    setCount(0);
    void refreshCount();
  }, [refreshCount, storeSlug]);

  const notifyAdded = useCallback(() => {
    void refreshCount();
    setToastOpen(true);
  }, [refreshCount]);

  const value = useMemo(
    () => ({ count, refreshCount, notifyAdded }),
    [count, refreshCount, notifyAdded],
  );

  return (
    <StoreCartContext.Provider value={value}>
      {children}
      <AddToCartToast
        open={toastOpen}
        cartHref={cartHref}
        onDismiss={() => setToastOpen(false)}
      />
    </StoreCartContext.Provider>
  );
}

export function useStoreCart(): StoreCartContextValue {
  const ctx = useContext(StoreCartContext);
  if (!ctx) {
    throw new Error('useStoreCart must be used within StoreCartProvider');
  }
  return ctx;
}

/** Opcional — fora do provider não quebra o botão de add. */
export function useStoreCartOptional(): StoreCartContextValue | null {
  return useContext(StoreCartContext);
}
