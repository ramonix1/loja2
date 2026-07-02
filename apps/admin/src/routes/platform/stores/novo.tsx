import { Button, Card, FieldInput, platformLabelClass, platformMutedClass, cn } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { ApiError } from '../../../lib/api-client';
import { createPlatformStore } from '../../../lib/platform-api';

export function PlatformStoreNovoPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [slug, setSlug] = useState('');
  const [nome, setNome] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => createPlatformStore({ slug: slug.trim(), nome: nome.trim() }),
    onSuccess: (store) => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['platform', 'stores'] });
      navigate(`/platform/stores/${store.slug}`, { replace: true });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Erro ao criar loja.');
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!slug.trim() || !nome.trim()) return;
    mutation.mutate();
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-bold text-[var(--platform-text)]">Nova loja</h1>
      <p className={cn('mb-6 text-sm', platformMutedClass())}>
        Cria a conta merchant, provisiona o banco e a primeira loja. O slug compõe a URL da vitrine (
        <code className="text-xs">/store/&lt;slug&gt;</code>).
      </p>

      <Card surface="platform">
        <form
          onSubmit={handleSubmit}
          data-testid={testIds.platform.storeCreateForm}
          className="space-y-4"
        >
          <div>
            <label htmlFor="slug" className={platformLabelClass('mb-1.5')}>
              Slug *
            </label>
            <FieldInput
              id="slug"
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              data-testid={testIds.platform.storeCreateSlug}
              placeholder="ex: acme"
              surface="platform"
            />
          </div>

          <div>
            <label htmlFor="nome" className={platformLabelClass('mb-1.5')}>
              Nome da loja *
            </label>
            <FieldInput
              id="nome"
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              data-testid={testIds.platform.storeCreateNome}
              placeholder="ex: Acme Comércio"
              surface="platform"
            />
          </div>

          {error && (
            <p data-testid={testIds.platform.storeCreateError} className="ds-alert-error-platform">
              {error}
            </p>
          )}

          <Button
            type="submit"
            surface="platform"
            data-testid={testIds.platform.storeCreateSubmit}
            disabled={mutation.isPending}
            className="w-full"
          >
            {mutation.isPending ? 'Criando…' : 'Criar loja'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
