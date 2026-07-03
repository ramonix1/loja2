'use client';

import { buildStorePath } from '@lojao/store-host';
import {
  IconButton,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@lojao/ui';
import { ActionIcons } from '@lojao/ui/icons';
import { store as testIds } from '@lojao/test-utils/test-ids/store';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { StoreNav } from '@/components/layout/store-nav';
import { StoreAccountLink } from '@/components/store/store-account-link';
import { StoreCartBadgeLink } from '@/components/store/store-cart-badge-link';
import { StoreWishlistBadgeLink } from '@/components/store/store-wishlist-badge-link';
import { StoreCategoryNav } from '@/components/store/store-category-nav';
import { StoreSearchInput } from '@/components/store/store-search-input';
import { legacyAssetUrl } from '@/lib/api';
import { storeShellClasses } from '@/lib/store-styles';
import type { PublicCategory, PublicStoreData } from '@lojao/types/public-store';

interface StoreHeaderNavProps {
  store: PublicStoreData['loja'];
  storeSlug: string;
  categorias: Pick<PublicCategory, 'id' | 'nome'>[];
}

export function StoreHeaderNav({ store, storeSlug, categorias }: StoreHeaderNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const homeHref = buildStorePath(storeSlug);
  const styles = storeShellClasses();
  const MenuIcon = ActionIcons.menu;
  const SearchIcon = ActionIcons.search;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <nav
      className={`border-b transition-shadow ${styles.header} ${scrolled ? 'shadow-sm' : ''}`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:gap-4 md:py-4">
        <Link href={homeHref} className="flex shrink-0 items-center gap-3 text-lg font-bold">
          {store.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={legacyAssetUrl(store.logo)}
              alt={store.nome}
              className="h-10 max-w-[140px] object-contain md:max-w-[160px]"
            />
          ) : (
            <span className="max-w-[120px] truncate md:max-w-none">{store.nome}</span>
          )}
        </Link>

        <StoreCategoryNav categorias={categorias} storeSlug={storeSlug} className="shrink-0" />

        <StoreSearchInput />

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <IconButton
            icon={<SearchIcon className="size-6" />}
            label={mobileSearchOpen ? 'Fechar busca' : 'Buscar produtos'}
            onClick={() => setMobileSearchOpen((open) => !open)}
            surface="store"
            variant="ghost"
            size="lg"
            className="md:hidden"
          />
          <StoreAccountLink className="hidden sm:inline-flex" />
          <StoreWishlistBadgeLink className="hidden sm:inline-flex" />
          <StoreCartBadgeLink />
          <IconButton
            icon={<MenuIcon className="size-6" />}
            label={mobileOpen ? 'Fechar menu' : 'Abrir menu de navegação'}
            onClick={() => setMobileOpen((open) => !open)}
            surface="store"
            variant="ghost"
            size="lg"
            testId={testIds.headerMenu}
            className="lg:hidden"
          />
        </div>
      </div>

      {mobileSearchOpen ? (
        <div className="border-t border-[var(--store-border)] px-4 py-3 md:hidden">
          <StoreSearchInput compact />
        </div>
      ) : null}

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="right"
          showCloseButton
          className="w-[min(100vw-2rem,20rem)] border-[var(--store-border)] bg-[var(--store-surface)] p-0"
        >
          <SheetTitle className="sr-only">Menu da loja</SheetTitle>
          <SheetDescription className="sr-only">Navegação principal da vitrine</SheetDescription>
          <div className="flex flex-col gap-4 p-4 pt-12">
            <StoreCategoryNav
              categorias={categorias}
              storeSlug={storeSlug}
              stacked
              onNavigate={closeMobile}
            />
            <StoreAccountLink className="sm:hidden" onNavigate={closeMobile} />
            <StoreWishlistBadgeLink className="sm:hidden" onNavigate={closeMobile} />
            <StoreNav stacked onNavigate={closeMobile} />
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
