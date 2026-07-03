'use client';

import { Button } from '@lojao/ui';
import { store as testIds } from '@lojao/test-utils/test-ids/store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AddToCartButton } from '@/components/add-to-cart-button';
import { QuantitySelector } from '@/components/store/quantity-selector';
import { TrustBadges } from '@/components/store/trust-badges';
import { addToCart, ApiError, fetchMe, type AuthUser } from '@/lib/client-api';
import {
  storeButtonOutlinePillClass,
  storeButtonPillClass,
  storeErrorTextClass,
} from '@/lib/store-styles';
import { useStoreHref, useStoreLoginHref } from '@/lib/use-store-href';

interface ProductPurchaseActionsProps {
  produtoId: number;
  esgotado: boolean;
  maxQuantidade?: number;
}

export function ProductPurchaseActions({
  produtoId,
  esgotado,
  maxQuantidade,
}: ProductPurchaseActionsProps) {
  const router = useRouter();
  const checkoutHref = useStoreHref('/checkout');
  const loginRedirectHref = useStoreLoginHref(`/produto/${produtoId}`);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [qty, setQty] = useState(1);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .finally(() => setLoadingUser(false));
  }, []);

  async function handleBuyNow() {
    setBuyLoading(true);
    setBuyError(null);
    try {
      await addToCart(produtoId, qty);
      router.push(checkoutHref);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        router.push(loginRedirectHref);
        return;
      }
      setBuyError(e instanceof ApiError ? e.message : 'Não foi possível continuar.');
    } finally {
      setBuyLoading(false);
    }
  }

  return (
    <div className="space-y-4 pt-2">
      <QuantitySelector
        value={qty}
        min={1}
        max={maxQuantidade}
        disabled={esgotado}
        onChange={setQty}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          surface="store"
          variant="primary"
          disabled={esgotado || buyLoading}
          data-testid={testIds.productBuyNowBtn}
          onClick={() => void handleBuyNow()}
          className={storeButtonPillClass(
            'inline-flex min-h-11 flex-1 items-center justify-center px-8 py-3 text-base sm:min-w-[200px]',
          )}
        >
          {buyLoading ? 'Processando…' : esgotado ? 'Esgotado' : 'Comprar agora'}
        </Button>
        <AddToCartButton
          produtoId={produtoId}
          quantidade={qty}
          disabled={esgotado}
          className={storeButtonOutlinePillClass(
            'inline-flex min-h-11 flex-1 items-center justify-center px-8 py-3 text-base sm:min-w-[200px]',
          )}
          label="Adicionar ao carrinho"
        />
      </div>

      {buyError ? <p className={storeErrorTextClass('text-sm')}>{buyError}</p> : null}

      {!loadingUser && !user ? (
        <Button
          surface="store"
          variant="secondary"
          asChild
          className={storeButtonOutlinePillClass('inline-flex px-6 py-2.5 text-sm')}
        >
          <Link href={loginRedirectHref}>Entrar para comprar</Link>
        </Button>
      ) : null}

      <TrustBadges />
    </div>
  );
}
