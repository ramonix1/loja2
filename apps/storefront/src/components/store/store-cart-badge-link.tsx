'use client';

import { store as testIds } from '@lojao/test-utils/test-ids/store';
import { NavIcons } from '@lojao/ui/icons';
import Link from 'next/link';

import { useStoreCart } from '@/lib/store-cart-context';
import { useStoreHref } from '@/lib/use-store-href';

interface StoreCartBadgeLinkProps {
  className?: string;
  onNavigate?: () => void;
}

export function StoreCartBadgeLink({ className, onNavigate }: StoreCartBadgeLinkProps) {
  const { count } = useStoreCart();
  const cartHref = useStoreHref('/cart');
  const CartIcon = NavIcons.cart;

  return (
    <Link
      href={cartHref}
      data-testid={testIds.headerCart}
      aria-label={count > 0 ? `Carrinho, ${count} itens` : 'Carrinho'}
      title="Carrinho"
      onClick={onNavigate}
      className={`relative inline-flex min-h-12 min-w-12 items-center justify-center rounded-lg text-[var(--store-text-muted)] transition hover:bg-[var(--store-surface-elevated)] hover:text-[var(--store-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[var(--store-focus-ring)] ${className ?? ''}`}
    >
      <CartIcon className="size-6 shrink-0" aria-hidden />
      {count > 0 ? (
        <span
          data-testid={testIds.headerCartBadge}
          className="absolute -top-0.5 -right-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--cor-primaria)] px-1 text-[10px] font-bold text-white"
        >
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Link>
  );
}
