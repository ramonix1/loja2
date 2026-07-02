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
import { useParams } from 'react-router-dom';

import { ApiError, storefrontUrlForSlug } from '../../../lib/api-client';
import { PlatformBackLink } from '../../../components/crud-icon-buttons';
import { getPlatformStore, impersonatePlatformStore, updatePlatformStore } from '../../../lib/platform-api';

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
    <div className="max-w-lg" data-testid={testIds.platform.storeDetail}>
      <PlatformBackLink to="/platform/stores" className="mb-4">
        Voltar
      </PlatformBackLink>

      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-[var(--platform-text)]">{store.nome}</h1>
        {!store.ativo && <span className="ds-badge-suspended">suspensa</span>}
      </div>

      <Card surface="platform" className="mb-4">
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

      <Card surface="platform" className="mb-4">
        <h2 className="mb-1 text-base font-bold text-[var(--platform-text)]">Suporte — impersonate</h2>
        <p className={cn('mb-4 text-sm', platformMutedClass())}>
          Entre no painel admin desta loja como o owner, para debug ou atendimento. Sua sessão de
          operador fica guardada — use &quot;Sair da impersonação&quot; no admin para voltar.
        </p>
        <Button
          surface="platform"
          disabled={impersonateMutation.isPending || !store.ativo}
          onClick={() => impersonateMutation.mutate()}
        >
          {impersonateMutation.isPending ? 'Entrando…' : 'Entrar como lojista'}
        </Button>
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
            data-testid={testIds.platform.storeSaveNome}
            disabled={mutation.isPending}
          >
            Salvar
          </Button>
        </form>
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
          disabled={mutation.isPending}
          onClick={() => setConfirmSuspend(true)}
          className={
            store.ativo
              ? 'text-[var(--platform-error)] hover:bg-[var(--platform-error-bg)] hover:text-[var(--platform-error)]'
              : undefined
          }
        >
          {store.ativo ? 'Suspender' : 'Reativar'}
        </Button>
      </Card>

      {error && <p className="ds-alert-error-platform mt-4">{error}</p>}

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
