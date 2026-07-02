import { store as testIds } from '@lojao/test-utils/test-ids/store';

import { StoreHeaderNav } from '@/components/layout/store-header-nav';
import type { PublicStoreData } from '@lojao/types/public-store';

interface StoreHeaderProps {
  store: PublicStoreData['loja'];
  storeSlug: string;
}

export function StoreHeader({ store, storeSlug }: StoreHeaderProps) {
  return (
    <header data-testid={testIds.header}>
      <StoreHeaderNav store={store} storeSlug={storeSlug} />
    </header>
  );
}
