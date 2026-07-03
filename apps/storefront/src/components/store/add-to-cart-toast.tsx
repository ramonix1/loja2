'use client';

import { Alert, AlertDescription, Button } from '@lojao/ui';
import { store as testIds } from '@lojao/test-utils/test-ids/store';
import Link from 'next/link';
import { useEffect } from 'react';

import { storeButtonPillClass } from '@/lib/store-styles';

interface AddToCartToastProps {
  open: boolean;
  cartHref: string;
  onDismiss: () => void;
}

export function AddToCartToast({ open, cartHref, onDismiss }: AddToCartToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onDismiss, 4000);
    return () => window.clearTimeout(timer);
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    <Alert
      role="status"
      aria-live="polite"
      data-testid={testIds.addCartToast}
      className="fixed bottom-4 left-1/2 z-50 w-[min(100vw-2rem,24rem)] -translate-x-1/2 border-[var(--store-border)] bg-[var(--store-surface)] py-3 shadow-lg"
    >
      <AlertDescription className="col-start-1 flex items-center justify-between gap-3 text-[var(--store-text)]">
        <span className="text-sm font-medium">Produto adicionado ao carrinho</span>
        <Button
          surface="store"
          variant="primary"
          asChild
          className={storeButtonPillClass('h-auto min-h-0 shrink-0 px-4 py-2 text-xs')}
        >
          <Link href={cartHref} onClick={onDismiss}>
            Ver carrinho
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
