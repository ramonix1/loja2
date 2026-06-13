import { store as testIds } from '@lojao/test-utils/test-ids/store';
import Link from 'next/link';

import { StoreNav } from '@/components/layout/store-nav';
import { legacyAssetUrl } from '@/lib/api';
import type { PublicStoreData } from '@lojao/types/public-store';

interface StoreHeaderProps {
  store: PublicStoreData['loja'];
}

export function StoreHeader({ store }: StoreHeaderProps) {
  return (
    <header data-testid={testIds.header}>
      <nav className="border-b border-gray-200 bg-gray-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex items-center gap-3 text-lg font-bold">
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
            <Link href="/" className="text-gray-300 hover:text-white">
              Home
            </Link>
            <StoreNav />
          </div>
        </div>
      </nav>
    </header>
  );
}
