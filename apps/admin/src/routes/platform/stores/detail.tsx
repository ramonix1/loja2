import {
  Button,
  Card,
  ConfirmDialog,
  FieldInput,
  KpiCell,
  KpiStrip,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  platformMutedClass,
  cn,
} from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import type { PlatformStoreDetail, PlatformStoreHealth } from '@lojao/types/platform';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ApiError, storefrontUrlForSlug } from '../../../lib/api-client';
import { PlatformBackLink } from '../../../components/crud-icon-buttons';
import {
  getPlatformStore,
  getPlatformStoreBilling,
  getPlatformStoreMetrics,
  impersonatePlatformStore,
  updatePlatformStore,
} from '../../../lib/platform-api';

const healthLabel: Record<PlatformStoreHealth, string> = {
  healthy: 'Saudável',
  attention: 'Atenção',
  suspended: 'Suspensa',
};

const healthClass: Record<PlatformStoreHealth, string> = {
  healthy: 'ds-badge-success',
  attention: 'rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300',
  suspended: 'ds-badge-suspended',
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

function StoreMetricsSidebar({ slug }: { slug: string }) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['platform', 'stores', slug, 'metrics'],
    queryFn: () => getPlatformStoreMetrics(slug),
    enabled: !!slug,
  });

  if (isLoading || !metrics) {
    return (
      <KpiStrip
        surface="platform"
        testId={testIds.platform.storeMetrics}
        primary={
          <>
            <KpiCell label="Pedidos (30d)" value="—" />
            <KpiCell label="GMV (30d)" value="—" />
          </>
        }
      />
    );
  }

  return (
    <div className="space-y-4" data-testid={testIds.platform.storeMetrics}>
      <KpiStrip
        surface="platform"
        primary={
          <>
            <KpiCell label="Pedidos (30d)" value={metrics.orders30d ?? '—'} />
            <KpiCell label="GMV (30d)" value={metrics.gmv30dCents != null ? metrics.gmv30dCents : '—'} />
          </>
        }
      />
      <Card surface="platform" className="p-4">
        <div className="mb-2 text-sm font-semibold text-[var(--platform-text)]">Saúde</div>
        <span className={healthClass[metrics.health]}>{healthLabel[metrics.health]}</span>
        {metrics.healthReasons.length > 0 ? (
          <ul className={cn('mt-3 list-disc space-y-1 pl-4 text-sm', platformMutedClass())}>
            {metrics.healthReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : null}
      </Card>
    </div>
  );
}

function StoreBillingTab({ slug }: { slug: string }) {
  const { data: billing, isLoading } = useQuery({
    queryKey: ['platform', 'stores', slug, 'billing'],
    queryFn: () => getPlatformStoreBilling(slug),
    enabled: !!slug,
  });

  if (isLoading || !billing) {
    return (
      <Card surface="platform" data-testid={`${testIds.platform.storeTabBilling}-panel`}>
        Carregando billing…
      </Card>
    );
  }

  return (
    <Card surface="platform" data-testid={`${testIds.platform.storeTabBilling}-panel`}>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className={platformMutedClass()}>Status</dt>
          <dd className="font-medium text-[var(--platform-text)]">{billing.status ?? 'Sem billing'}</dd>
        </div>
        <div>
          <dt className={platformMutedClass()}>Plano</dt>
          <dd className="text-[var(--platform-text)]">{billing.planName ?? billing.planSlug ?? '—'}</dd>
        </div>
        <div>
          <dt className={platformMutedClass()}>Mensalidade</dt>
          <dd className="text-[var(--platform-text)]">
            {billing.monthlyFee != null ? `R$ ${billing.monthlyFee.toFixed(2)}` : '—'}
          </dd>
        </div>
        <div>
          <dt className={platformMutedClass()}>Trial até</dt>
          <dd className="text-[var(--platform-text)]">{formatDate(billing.trialEndsAt)}</dd>
        </div>
        <div>
          <dt className={platformMutedClass()}>Próxima cobrança</dt>
          <dd className="text-[var(--platform-text)]">{formatDate(billing.nextBillingDate)}</dd>
        </div>
        <div>
          <dt className={platformMutedClass()}>Faturas</dt>
          <dd className="text-[var(--platform-text)]">{billing.invoicesCount}</dd>
        </div>
      </dl>
      {!billing.status ? (
        <p className={cn('mt-4 text-sm', platformMutedClass())}>
          Esta conta ainda não possui registro em `merchant_billing`. Provisionamento via signup registra
          trial automaticamente.
        </p>
      ) : null}
    </Card>
  );
}

function StoreActionsTab({
  store,
  error,
  mutationPending,
  impersonatePending,
  onImpersonate,
  onConfirmSuspend,
}: {
  store: PlatformStoreDetail;
  error: string | null;
  mutationPending: boolean;
  impersonatePending: boolean;
  onImpersonate: () => void;
  onConfirmSuspend: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card surface="platform">
        <h2 className="mb-1 text-base font-bold text-[var(--platform-text)]">Suporte — impersonate</h2>
        <p className={cn('mb-4 text-sm', platformMutedClass())}>
          Entre no painel admin desta loja como o owner, para debug ou atendimento.
        </p>
        <Button
          surface="platform"
          disabled={impersonatePending || !store.ativo}
          onClick={onImpersonate}
        >
          {impersonatePending ? 'Entrando…' : 'Entrar como lojista'}
        </Button>
      </Card>

      <Card surface="platform">
        <h2 className="mb-1 text-base font-bold text-[var(--platform-text)]">
          {store.ativo ? 'Suspender loja' : 'Reativar loja'}
        </h2>
        <p className={cn('mb-4 text-sm', platformMutedClass())}>
          {store.ativo
            ? 'A vitrine e o admin ficam indisponíveis enquanto suspensa.'
            : 'Reativa o acesso à vitrine e ao admin da loja.'}
        </p>
        <Button
          variant="ghost"
          surface="platform"
          data-testid={testIds.platform.storeToggleAtivo}
          disabled={mutationPending}
          onClick={onConfirmSuspend}
          className={
            store.ativo
              ? 'text-[var(--platform-error)] hover:bg-[var(--platform-error-bg)] hover:text-[var(--platform-error)]'
              : undefined
          }
        >
          {store.ativo ? 'Suspender' : 'Reativar'}
        </Button>
      </Card>

      {error ? <p className="ds-alert-error-platform">{error}</p> : null}
    </div>
  );
}

export function PlatformStoreDetailPage() {
  const { slug = '' } = useParams();
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  const { data: store, isLoading } = useQuery({
    queryKey: ['platform', 'stores', slug],
    queryFn: () => getPlatformStore(slug),
    enabled: !!slug,
  });

  useEffect(() => {
    if (store) setNome(store.nome);
  }, [store]);

  const mutation = useMutation({
    mutationFn: (patch: { nome?: string; ativo?: boolean }) => updatePlatformStore(slug, patch),
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['platform', 'stores'] });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Erro ao atualizar loja.');
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: () => impersonatePlatformStore(slug),
    onSuccess: (data) => {
      window.location.href = data.adminUrl;
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar como lojista.');
    },
  });

  if (isLoading || !store) {
    return (
      <Card surface="platform" className={cn('text-center', platformMutedClass())}>
        Carregando…
      </Card>
    );
  }

  function handleSaveNome(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    mutation.mutate({ nome: nome.trim() });
  }

  return (
    <div className="mx-auto max-w-5xl" data-testid={testIds.platform.storeDetail}>
      <PlatformBackLink to="/platform/stores" className="mb-4">
        Voltar
      </PlatformBackLink>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-[var(--platform-text)]">{store.nome}</h1>
        <span className={healthClass[store.health]}>{healthLabel[store.health]}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Tabs defaultValue="overview" className="min-w-0">
          <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            <TabsTrigger
              value="overview"
              data-testid={testIds.platform.storeTabOverview}
              className="data-[state=active]:bg-[var(--platform-accent)] data-[state=active]:text-white"
            >
              Visão geral
            </TabsTrigger>
            <TabsTrigger
              value="merchant"
              data-testid={testIds.platform.storeTabMerchant}
              className="data-[state=active]:bg-[var(--platform-accent)] data-[state=active]:text-white"
            >
              Merchant
            </TabsTrigger>
            <TabsTrigger
              value="billing"
              data-testid={testIds.platform.storeTabBilling}
              className="data-[state=active]:bg-[var(--platform-accent)] data-[state=active]:text-white"
            >
              Billing
            </TabsTrigger>
            <TabsTrigger
              value="acoes"
              data-testid={testIds.platform.storeTabAcoes}
              className="data-[state=active]:bg-[var(--platform-accent)] data-[state=active]:text-white"
            >
              Ações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card surface="platform">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className={platformMutedClass()}>Slug</dt>
                  <dd className="font-mono text-[var(--platform-text)]">{store.slug}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className={platformMutedClass()}>Plano</dt>
                  <dd className="text-[var(--platform-text)]">{store.plano ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className={platformMutedClass()}>Criada em</dt>
                  <dd className="text-[var(--platform-text)]">{formatDate(store.createdAt)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className={platformMutedClass()}>Vitrine</dt>
                  <dd>
                    <a
                      href={storefrontUrlForSlug(store.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ds-link text-sm"
                    >
                      /store/{store.slug}
                    </a>
                  </dd>
                </div>
              </dl>
            </Card>

            <Card surface="platform">
              <h2 className="mb-4 text-base font-bold text-[var(--platform-text)]">Renomear</h2>
              <form onSubmit={handleSaveNome} className="flex flex-col gap-2 sm:flex-row">
                <FieldInput
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  surface="platform"
                  className="flex-1"
                />
                <Button
                  type="submit"
                  surface="platform"
                  data-testid={testIds.platform.storeSaveNome}
                  disabled={mutation.isPending}
                >
                  Salvar
                </Button>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="merchant">
            <Card surface="platform">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className={platformMutedClass()}>Conta</dt>
                  <dd className="text-[var(--platform-text)]">{store.merchantName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className={platformMutedClass()}>Slug merchant</dt>
                  <dd className="font-mono text-[var(--platform-text)]">{store.merchantSlug}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className={platformMutedClass()}>ID</dt>
                  <dd className="font-mono text-[var(--platform-text)]">{store.merchantId}</dd>
                </div>
              </dl>
              <Link
                to={`/platform/merchants?q=${encodeURIComponent(store.merchantSlug)}`}
                className="ds-link mt-4 inline-block text-sm"
              >
                Ver na listagem de merchants
              </Link>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <StoreBillingTab slug={slug} />
          </TabsContent>

          <TabsContent value="acoes">
            <StoreActionsTab
              store={store}
              error={error}
              mutationPending={mutation.isPending}
              impersonatePending={impersonateMutation.isPending}
              onImpersonate={() => impersonateMutation.mutate()}
              onConfirmSuspend={() => setConfirmSuspend(true)}
            />
          </TabsContent>
        </Tabs>

        <aside className="hidden lg:block">
          <StoreMetricsSidebar slug={slug} />
        </aside>
      </div>

      <ConfirmDialog
        open={confirmSuspend}
        onOpenChange={setConfirmSuspend}
        surface="platform"
        title={store.ativo ? 'Suspender loja' : 'Reativar loja'}
        description={
          store.ativo
            ? 'A vitrine e o admin ficam indisponíveis enquanto a loja estiver suspensa.'
            : 'Reativa o acesso à vitrine e ao admin da loja.'
        }
        confirmLabel={store.ativo ? 'Suspender' : 'Reativar'}
        destructive={store.ativo}
        loading={mutation.isPending}
        onConfirm={() => mutation.mutate({ ativo: !store.ativo })}
      />
    </div>
  );
}
