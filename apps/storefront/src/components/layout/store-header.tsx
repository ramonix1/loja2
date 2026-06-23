import { buildStorePath } from '@lojao/tenant-host';
import { store as testIds } from '@lojao/test-utils/test-ids/store';
import type { StoreTheme } from '@lojao/types/store-theme';
import Link from 'next/link';

import { StoreNav } from '@/components/layout/store-nav';
import { legacyAssetUrl } from '@/lib/api';
import { storeShellClasses } from '@/lib/store-styles';
import type { PublicStoreData } from '@lojao/types/public-store';

interface StoreHeaderProps {
  store: PublicStoreData['loja'];
  storeSlug: string;
}

export function StoreHeader({ store, storeSlug }: StoreHeaderProps) {
  const homeHref = buildStorePath(storeSlug);
  const tema: StoreTheme = store.tema ?? 'escuro';
  const styles = storeShellClasses(tema);

  return (
    <header data-testid={testIds.header}>
      <nav className={`border-b ${styles.header}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href={homeHref} className="flex items-center gap-3 text-lg font-bold">
            {store.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={legacyAssetUrl(store.logo)}
                alt={store.nome}
                className="h-10 max-w-[160px] object-contain"
              />
            ) : (
              <span>{store.nome}</span>
            )}
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href={homeHref} className={styles.navLink}>
              Home
            </Link>
            <StoreNav tema={tema} />
          </div>
        </div>
      </nav>
    </header>
  );
}
