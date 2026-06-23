import { Button, Card, platformMutedClass, cn } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { storefrontUrlForSlug } from '../../../lib/api-client';
import { listTenants } from '../../../lib/platform-api';

export function PlatformTenantsPage() {
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['platform', 'tenants'],
    queryFn: listTenants,
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-[var(--platform-text)]">Lojas</h1>
          <p className={cn('text-sm', platformMutedClass())}>
            Gerencie os tenants da plataforma.
          </p>
        </div>
        <Link to="/platform/tenants/novo" data-testid={testIds.platform.tenantCreateLink}>
          <Button surface="platform">+ Nova loja</Button>
        </Link>
      </div>

      {isLoading ? (
        <Card surface="platform" className={cn('text-center', platformMutedClass())}>
          Carregando…
        </Card>
      ) : (
        <div data-testid={testIds.platform.tenantsList} className="space-y-3">
          {tenants.length === 0 ? (
            <Card
              surface="platform"
              data-testid={testIds.platform.tenantsEmpty}
              className={cn('py-12 text-center', platformMutedClass())}
            >
              Nenhuma loja cadastrada ainda.
            </Card>
          ) : (
            tenants.map((tenant) => (
              <div
                key={tenant.slug}
                data-testid={testIds.platform.tenantsRow(tenant.slug)}
                className="platform-tenant-row"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-[var(--platform-text)]">
                      {tenant.nome}
                    </span>
                    {!tenant.ativo && <span className="ds-badge-suspended">suspensa</span>}
                  </div>
                  <div className={cn('mt-0.5 text-xs', platformMutedClass())}>
                    /store/{tenant.slug}
                    {tenant.plano ? ` · ${tenant.plano}` : ''}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={storefrontUrlForSlug(tenant.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'inline-flex min-h-10 touch-manipulation items-center rounded-lg border border-[var(--platform-border)] px-3 py-1.5 text-sm font-medium transition',
                      platformMutedClass(),
                      'hover:bg-[var(--platform-sidebar-hover-bg)] hover:text-[var(--platform-text)]',
                    )}
                  >
                    Ver vitrine
                  </a>
                  <Link to={`/platform/tenants/${tenant.slug}`}>
                    <Button variant="ghost" surface="platform">
                      Detalhes
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
