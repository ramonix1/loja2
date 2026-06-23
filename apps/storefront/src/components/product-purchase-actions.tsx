'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { AddToCartButton } from '@/components/add-to-cart-button';
import { fetchMe, type AuthUser } from '@/lib/client-api';
import { useStoreLoginHref } from '@/lib/use-store-href';

interface ProductPurchaseActionsProps {
  produtoId: number;
  esgotado: boolean;
}

export function ProductPurchaseActions({ produtoId, esgotado }: ProductPurchaseActionsProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const loginHref = useStoreLoginHref(`/produto/${produtoId}`);

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-wrap gap-3 pt-2">
      <AddToCartButton produtoId={produtoId} disabled={esgotado} />
      {!loading && !user ? (
        <Link href={loginHref} className="btn-outline px-6 py-3 text-base">
          Entrar para comprar
        </Link>
      ) : null}
    </div>
  );
}
