import {
  Button,
  Card,
  FieldInput,
  ConfirmDialog,
  platformMutedClass,
  cn,
} from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ApiError, storefrontUrlForSlug } from '../../../lib/api-client';
import { getTenant, updateTenant } from '../../../lib/platform-api';

export function PlatformTenantDetailPage() {
  const { slug = '' } = useParams();
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['platform', 'tenants', slug],
    queryFn: () => getTenant(slug),
    enabled: !!slug,
  });

  useEffect(() => {
    if (tenant) setNome(tenant.nome);
  }, [tenant]);

  const mutation = useMutation({
    mutationFn: (patch: { nome?: string; ativo?: boolean }) => updateTenant(slug, patch),
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['platform', 'tenants'] });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Erro ao atualizar loja.');
    },
  });

  if (isLoading || !tenant) {
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
    <div className="max-w-lg" data-testid={testIds.platform.tenantDetail}>
      <Link
        to="/platform/tenants"
        className={cn('ds-link mb-4 inline-block text-sm', platformMutedClass())}
      >
        ← Voltar
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-[var(--platform-text)]">{tenant.nome}</h1>
        {!tenant.ativo && <span className="ds-badge-suspended">suspensa</span>}
      </div>

      <Card surface="platform" className="mb-4">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className={platformMutedClass()}>Slug</dt>
            <dd className="font-mono text-[var(--platform-text)]">{tenant.slug}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className={platformMutedClass()}>Plano</dt>
            <dd className="text-[var(--platform-text)]">{tenant.plano ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className={platformMutedClass()}>Vitrine</dt>
            <dd>
              <a
                href={storefrontUrlForSlug(tenant.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="ds-link text-sm"
              >
                /store/{tenant.slug}
              </a>
            </dd>
          </div>
        </dl>
      </Card>

      <Card surface="platform" className="mb-4">
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
            data-testid={testIds.platform.tenantSaveNome}
            disabled={mutation.isPending}
          >
            Salvar
          </Button>
        </form>
      </Card>

      <Card surface="platform">
        <h2 className="mb-1 text-base font-bold text-[var(--platform-text)]">
          {tenant.ativo ? 'Suspender loja' : 'Reativar loja'}
        </h2>
        <p className={cn('mb-4 text-sm', platformMutedClass())}>
          {tenant.ativo
            ? 'A vitrine e o admin ficam indisponíveis enquanto suspensa.'
            : 'Reativa o acesso à vitrine e ao admin da loja.'}
        </p>
        <Button
          variant="ghost"
          surface="platform"
          data-testid={testIds.platform.tenantToggleAtivo}
          disabled={mutation.isPending}
          onClick={() => setConfirmSuspend(true)}
          className={
            tenant.ativo
              ? 'text-[var(--platform-error)] hover:bg-[var(--platform-error-bg)] hover:text-[var(--platform-error)]'
              : undefined
          }
        >
          {tenant.ativo ? 'Suspender' : 'Reativar'}
        </Button>
      </Card>

      {error && <p className="ds-alert-error-platform mt-4">{error}</p>}

      <ConfirmDialog
        open={confirmSuspend}
        onOpenChange={setConfirmSuspend}
        surface="platform"
        title={tenant.ativo ? 'Suspender loja' : 'Reativar loja'}
        description={
          tenant.ativo
            ? 'A vitrine e o admin ficam indisponíveis enquanto a loja estiver suspensa.'
            : 'Reativa o acesso à vitrine e ao admin da loja.'
        }
        confirmLabel={tenant.ativo ? 'Suspender' : 'Reativar'}
        destructive={tenant.ativo}
        loading={mutation.isPending}
        onConfirm={() => mutation.mutate({ ativo: !tenant.ativo })}
      />
    </div>
  );
}
