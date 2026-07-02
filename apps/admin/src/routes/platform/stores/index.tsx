import { Button, Card, platformMutedClass, cn } from '@lojao/ui';
import { ActionIcons } from '@lojao/ui/icons';
import { testIds } from '@lojao/test-utils';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { storefrontUrlForSlug } from '../../../lib/api-client';
import { EditIconButton, ViewIconButton } from '../../../components/crud-icon-buttons';
import { listPlatformStores } from '../../../lib/platform-api';

export function PlatformStoresPage() {
  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['platform', 'stores'],
    queryFn: listPlatformStores,
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-[var(--platform-text)]">Lojas</h1>
          <p className={cn('text-sm', platformMutedClass())}>
            Gerencie as lojas da plataforma.
          </p>
        </div>
        <Link to="/platform/stores/novo" data-testid={testIds.platform.storeCreateLink}>
          <Button surface="platform">
            <ActionIcons.add className="mr-2 inline size-5" aria-hidden />
            Nova loja
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <Card surface="platform" className={cn('text-center', platformMutedClass())}>
          Carregando…
        </Card>
      ) : (
        <div data-testid={testIds.platform.storesList} className="space-y-3">
          {stores.length === 0 ? (
            <Card
              surface="platform"
              data-testid={testIds.platform.storesEmpty}
              className={cn('py-12 text-center', platformMutedClass())}
            >
              Nenhuma loja cadastrada ainda.
            </Card>
          ) : (
            stores.map((store) => (
              <div
                key={store.slug}
                data-testid={testIds.platform.storesRow(store.slug)}
                className="platform-store-row"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-[var(--platform-text)]">
                      {store.nome}
                    </span>
                    {!store.ativo && <span className="ds-badge-suspended">suspensa</span>}
                  </div>
                  <div className={cn('mt-0.5 text-xs', platformMutedClass())}>
                    /store/{store.slug}
                    {store.plano ? ` · ${store.plano}` : ''}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <ViewIconButton
                    href={storefrontUrlForSlug(store.slug)}
                    external
                    surface="platform"
                    label="Ver vitrine"
                  />
                  <EditIconButton
                    to={`/platform/stores/${store.slug}`}
                    surface="platform"
                    label="Detalhes da loja"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
