'use client';

import { buildStorePath } from '@lojao/store-host';
import {
  IconButton,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@lojao/ui';
import { ActionIcons, NavIcons } from '@lojao/ui/icons';
import { store as testIds } from '@lojao/test-utils/test-ids/store';
import Link from 'next/link';
import { useState } from 'react';

import { StoreNav } from '@/components/layout/store-nav';
import { legacyAssetUrl } from '@/lib/api';
import { storeShellClasses } from '@/lib/store-styles';
import type { PublicStoreData } from '@lojao/types/public-store';

interface StoreHeaderNavProps {
  store: PublicStoreData['loja'];
  storeSlug: string;
}

export function StoreHeaderNav({ store, storeSlug }: StoreHeaderNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const homeHref = buildStorePath(storeSlug);
  const styles = storeShellClasses();
  const HomeIcon = NavIcons.dashboard;
  const MenuIcon = ActionIcons.menu;

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <nav className={`border-b ${styles.header}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href={homeHref} className="flex min-w-0 items-center gap-3 text-lg font-bold">
          {store.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={legacyAssetUrl(store.logo)}
              alt={store.nome}
              className="h-10 max-w-[160px] object-contain"
            />
          ) : (
            <span className="truncate">{store.nome}</span>
          )}
        </Link>

        <div className="hidden items-center gap-4 text-sm md:flex">
          <Link href={homeHref} className={`${styles.navLink} inline-flex items-center gap-2`}>
            <HomeIcon className="size-5 shrink-0" aria-hidden />
            Home
          </Link>
          <StoreNav />
        </div>

        <IconButton
          icon={<MenuIcon />}
          label={mobileOpen ? 'Fechar menu' : 'Abrir menu de navegação'}
          onClick={() => setMobileOpen((open) => !open)}
          surface="store"
          variant="ghost"
          size="md"
          testId={testIds.headerMenu}
          className="md:hidden"
        />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="right"
          showCloseButton
          className="w-[min(100vw-2rem,20rem)] border-[var(--store-border)] bg-[var(--store-surface)] p-0"
        >
          <SheetTitle className="sr-only">Menu da loja</SheetTitle>
          <SheetDescription className="sr-only">
            Navegação principal da vitrine
          </SheetDescription>
          <div className="flex flex-col gap-4 p-4 pt-12">
            <Link
              href={homeHref}
              className={`${styles.navLink} flex min-h-12 items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium`}
              onClick={closeMobile}
            >
              <HomeIcon className="size-5 shrink-0" aria-hidden />
              Home
            </Link>
            <StoreNav stacked onNavigate={closeMobile} />
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
