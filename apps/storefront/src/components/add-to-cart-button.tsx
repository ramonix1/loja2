'use client';

import { Button } from '@lojao/ui';
import { NavIcons } from '@lojao/ui/icons';
import { store as testIds } from '@lojao/test-utils/test-ids/store';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { addToCart, ApiError } from '@/lib/client-api';
import { useStoreCartOptional } from '@/lib/store-cart-context';
import {
  storeButtonOutlinePillClass,
  storeButtonPillClass,
  storeErrorTextClass,
} from '@/lib/store-styles';
import { useStoreHref, useStoreLoginHref } from '@/lib/use-store-href';

interface AddToCartButtonProps {
  produtoId: number;
  quantidade?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
  /** Redireciona ao carrinho após add (ex.: Comprar agora na PDP). */
  redirectAfterAdd?: boolean;
  /** `outline` — pill secundário (card). `primary` — CTA sólido. */
  variant?: 'primary' | 'outline';
}

export function AddToCartButton({
  produtoId,
  quantidade = 1,
  disabled,
  className,
  label = 'Adicionar ao carrinho',
  redirectAfterAdd = false,
  variant = 'outline',
}: AddToCartButtonProps) {
  const router = useRouter();
  const cartHref = useStoreHref('/cart');
  const loginRedirectHref = useStoreLoginHref(`/produto/${produtoId}`);
  const cart = useStoreCartOptional();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      await addToCart(produtoId, quantidade);
      if (redirectAfterAdd) {
        router.push(cartHref);
      } else {
        cart?.notifyAdded();
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        router.push(loginRedirectHref);
        return;
      }
      setError(e instanceof ApiError ? e.message : 'Não foi possível adicionar ao carrinho.');
    } finally {
      setLoading(false);
    }
  }

  const isPrimary = variant === 'primary';

  return (
    <div>
      <Button
        type="button"
        surface="store"
        variant={isPrimary ? 'primary' : 'secondary'}
        disabled={disabled || loading}
        data-testid={testIds.productAddCartBtn}
        onClick={handleClick}
        className={
          className ??
          (isPrimary
            ? `${storeButtonPillClass()} inline-flex w-full items-center justify-center gap-2 px-8 py-3 text-base`
            : `${storeButtonOutlinePillClass()} inline-flex w-full items-center justify-center px-8 py-3 text-base`)
        }
      >
        {isPrimary ? <NavIcons.cart className="size-5 shrink-0" aria-hidden /> : null}
        {loading ? 'Adicionando…' : disabled ? 'Esgotado' : label}
      </Button>
      {error ? <p className={storeErrorTextClass('mt-2 text-sm')}>{error}</p> : null}
    </div>
  );
}
