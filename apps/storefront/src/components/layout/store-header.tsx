import { store as testIds } from '@lojao/test-utils/test-ids/store';

import { StoreHeaderNav } from '@/components/layout/store-header-nav';
import type { PublicCategory, PublicStoreData } from '@lojao/types/public-store';

interface StoreHeaderProps {
  store: PublicStoreData['loja'];
  storeSlug: string;
  categorias: Pick<PublicCategory, 'id' | 'nome'>[];
}

export function StoreHeader({ store, storeSlug, categorias }: StoreHeaderProps) {
  return (
    <header data-testid={testIds.header} className="sticky top-0 z-40">
      <StoreHeaderNav store={store} storeSlug={storeSlug} categorias={categorias} />
    </header>
  );
}
