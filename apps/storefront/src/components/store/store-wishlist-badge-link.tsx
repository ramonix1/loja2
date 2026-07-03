'use client';

import { store as testIds } from '@lojao/test-utils/test-ids/store';
import { NavIcons } from '@lojao/ui/icons';
import Link from 'next/link';

import { useStoreWishlist } from '@/lib/store-wishlist-context';
import { useStoreHref } from '@/lib/use-store-href';

interface StoreWishlistBadgeLinkProps {
  className?: string;
  onNavigate?: () => void;
}

export function StoreWishlistBadgeLink({ className, onNavigate }: StoreWishlistBadgeLinkProps) {
  const { count } = useStoreWishlist();
  const wishlistHref = useStoreHref('/wishlist');
  const WishlistIcon = NavIcons.wishlist;

  return (
    <Link
      href={wishlistHref}
      data-testid={testIds.headerWishlist}
      aria-label={count > 0 ? `Favoritos, ${count} itens` : 'Favoritos'}
      title="Favoritos"
      onClick={onNavigate}
      className={`relative inline-flex min-h-12 min-w-12 items-center justify-center rounded-lg text-[var(--store-text-muted)] transition hover:bg-[var(--store-surface-elevated)] hover:text-[var(--store-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[var(--store-focus-ring)] ${className ?? ''}`}
    >
      <WishlistIcon className="size-6 shrink-0" aria-hidden />
      {count > 0 ? (
        <span
          data-testid={testIds.headerWishlistBadge}
          className="absolute -top-0.5 -right-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--cor-primaria)] px-1 text-[10px] font-bold text-white"
        >
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Link>
  );
}
