'use client';

import { store as testIds } from '@lojao/test-utils/test-ids/store';
import { useEffect, useMemo, useState } from 'react';

import { ProductGrid } from '@/components/product-grid';
import { ApiError, fetchMe, fetchWishlistProducts } from '@/lib/client-api';
import { useStoreWishlist } from '@/lib/store-wishlist-context';
import { Button, Card } from '@lojao/ui';
import type { PublicProduct } from '@lojao/types/public-store';
import Link from 'next/link';
import { storeHeadingClass, storeMutedClass, storeButtonOutlinePillClass, storeButtonPillClass } from '@/lib/store-styles';
import { useStoreHref, useStoreLoginHref } from '@/lib/use-store-href';
import { useStoreSlug } from '@/lib/store-slug-context';

interface WishlistPageClientProps {
  controlaEstoque: boolean;
}

export function WishlistPageClient({ controlaEstoque }: WishlistPageClientProps) {
  const slug = useStoreSlug();
  const { count: wishlistCount, isWishlisted } = useStoreWishlist();
  const loginHref = useStoreLoginHref('/wishlist');
  const homeHref = useStoreHref('/');
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const user = await fetchMe();
      if (!user || user.role !== 'usuario') {
        if (!cancelled) {
          setNeedsLogin(true);
          setLoading(false);
        }
        return;
      }
      try {
        const list = await fetchWishlistProducts();
        if (!cancelled) {
          setProducts(list);
          setNeedsLogin(false);
        }
      } catch (e) {
        if (!cancelled && e instanceof ApiError && e.status === 401) {
          setNeedsLogin(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [wishlistCount]);

  const visibleProducts = useMemo(
    () => products.filter((p) => isWishlisted(p.id)),
    [products, isWishlisted, wishlistCount],
  );

  if (loading) {
    return <p className={storeMutedClass('text-sm')}>Carregando favoritos…</p>;
  }

  if (needsLogin) {
    return (
      <Card surface="store" className="rounded-2xl p-8 text-center shadow-sm">
        <p className={storeMutedClass('mb-4')}>Entre na sua conta para ver seus favoritos.</p>
        <Button surface="store" variant="primary" asChild className={storeButtonPillClass()}>
          <Link href={loginHref}>Entrar</Link>
        </Button>
      </Card>
    );
  }

  if (visibleProducts.length === 0) {
    return (
      <Card surface="store" className="rounded-2xl p-8 text-center shadow-sm">
        <p className={storeMutedClass('mb-4')}>Você ainda não salvou nenhum produto.</p>
        <Button surface="store" variant="secondary" asChild className={storeButtonOutlinePillClass()}>
          <Link href={homeHref}>Explorar produtos</Link>
        </Button>
      </Card>
    );
  }

  return (
    <ProductGrid
      title="Seus favoritos"
      sectionHeading
      products={visibleProducts}
      controlaEstoque={controlaEstoque}
      storeSlug={slug}
      layout="grid"
    />
  );
}

export function WishlistPageShell({ controlaEstoque }: WishlistPageClientProps) {
  return (
    <div data-testid={testIds.wishlistPage}>
      <h1 className={storeHeadingClass('mb-6 text-2xl')}>Favoritos</h1>
      <WishlistPageClient controlaEstoque={controlaEstoque} />
    </div>
  );
}
