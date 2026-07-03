'use client';

import { IconButton } from '@lojao/ui';
import { ActionIcons } from '@lojao/ui/icons';
import { store as testIds } from '@lojao/test-utils/test-ids/store';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { fetchMe } from '@/lib/client-api';
import { useStoreWishlistOptional } from '@/lib/store-wishlist-context';
import { useStoreSlug } from '@/lib/store-slug-context';
import { useStoreLoginHref } from '@/lib/use-store-href';

interface WishlistButtonProps {
  productId: number;
  className?: string;
}

export function WishlistButton({ productId, className = '' }: WishlistButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const slug = useStoreSlug();
  const storePrefix = `/store/${slug}`;
  const subpath = pathname.startsWith(storePrefix)
    ? pathname.slice(storePrefix.length) || '/'
    : '/';
  const loginHref = useStoreLoginHref(subpath);
  const wishlist = useStoreWishlistOptional();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const HeartIcon = ActionIcons.heart;

  const isWishlisted = wishlist?.isWishlisted(productId) ?? false;

  useEffect(() => {
    fetchMe().then((user) => setLoggedIn(user != null && user.role === 'usuario'));
  }, []);

  async function handleClick() {
    if (loggedIn === false) {
      router.push(loginHref);
      return;
    }

    if (!wishlist || pending) return;

    setPending(true);
    try {
      await wishlist.toggle(productId);
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className={className}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role="presentation"
    >
      <IconButton
        icon={
          <HeartIcon
            className={`size-5 transition ${isWishlisted ? 'fill-[var(--cor-primaria)] text-[var(--cor-primaria)]' : ''}`}
            aria-hidden
          />
        }
        label={isWishlisted ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        onClick={() => void handleClick()}
        surface="store"
        variant="ghost"
        size="md"
        disabled={pending || loggedIn === null}
        testId={testIds.wishlistBtn(productId)}
        className="bg-[var(--store-surface)]/90 shadow-sm backdrop-blur-sm hover:bg-[var(--store-surface)]"
      />
    </div>
  );
}
