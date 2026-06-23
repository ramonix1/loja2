import {
  Button,
  Card,
  FieldInput,
  ConfirmDialog,
  adminEmptyStateClass,
  adminFieldLabelClass,
  adminMutedClass,
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminSectionTitleClass,
  cn,
} from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { ApiError, apiFetch } from '../../../lib/api-client';

interface Categoria {
  id: number;
  nome: string;
  ordem: number;
  total_produtos: number;
}

function fetchCategorias() {
  return apiFetch<{ data: Categoria[] }>('/api/v1/admin/categorias').then((r) => r.data);
}

export function CategoriasPage() {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; nome: string } | null>(null);

  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ['admin', 'categorias'],
    queryFn: fetchCategorias,
  });

  const createMutation = useMutation({
    mutationFn: (nomeCategoria: string) =>
      apiFetch<{ data: { id: number } }>('/api/v1/admin/categorias', {
        method: 'POST',
        body: JSON.stringify({ nome: nomeCategoria }),
      }),
    onSuccess: () => {
      setNome('');
      setCreateError(null);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'categorias'] });
    },
    onError: (err) => {
      setCreateError(err instanceof ApiError ? err.message : 'Erro ao criar categoria.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/v1/admin/categorias/${id}`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'categorias'] }),
  });

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    createMutation.mutate(nome.trim());
  }

  function handleDelete(id: number, nomeCat: string) {
    setDeleteTarget({ id, nome: nomeCat });
  }

  return (
    <div>
      <h1 className={adminPageTitleClass('mb-1')}>Categorias</h1>
      <p className={adminPageSubtitleClass('mb-6')}>
        Agrupe produtos em seções exibidas na vitrine.
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isLoading ? (
            <Card surface="admin" className={cn('text-center', adminMutedClass())}>
              Carregando…
            </Card>
          ) : (
            <div data-testid={testIds.adminCategorias.table} className="space-y-3">
              {categorias.length === 0 ? (
                <Card
                  surface="admin"
                  data-testid={testIds.adminCategorias.emptyState}
                  className={adminEmptyStateClass('py-12')}
                >
                  Nenhuma categoria criada ainda. Use o formulário ao lado para criar a primeira.
                </Card>
              ) : (
              categorias.map((cat) => (
                <div
                  key={cat.id}
                  data-testid={testIds.adminCategorias.row(cat.id)}
                  className="flex items-center justify-between gap-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5"
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-[var(--admin-text)]">{cat.nome}</div>
                    <div className={cn('mt-0.5 text-xs', adminMutedClass())}>
                      {cat.total_produtos} produto{cat.total_produtos !== 1 ? 's' : ''}
                      {cat.ordem > 0 ? ` · ordem ${cat.ordem}` : ''}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link to={`/admin/categorias/${cat.id}`}>
                      <Button variant="secondary" className="text-sm">
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      data-testid={testIds.adminCategorias.deleteBtn}
                      className={cn('text-[var(--admin-error-text)] hover:bg-[var(--admin-error-bg)]')}
                      onClick={() => handleDelete(cat.id, cat.nome)}
                      disabled={deleteMutation.isPending}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              )))}
            </div>
          )}
        </div>

        <Card surface="admin">
          <h2 className={adminSectionTitleClass('mb-4')}>Nova categoria</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="cat-nome" className={adminFieldLabelClass()}>
                Nome *
              </label>
              <FieldInput
                id="cat-nome"
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                data-testid={testIds.adminCategorias.nomeInput}
                placeholder="Ex: Calçados, Roupas…"
              />
            </div>
            {createError && (
              <p className="ds-alert-error text-sm">{createError}</p>
            )}
            <Button
              type="submit"
              data-testid={testIds.adminCategorias.createBtn}
              disabled={createMutation.isPending}
              className="w-full"
            >
              + Criar categoria
            </Button>
          </form>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remover categoria"
        description={
          deleteTarget
            ? `Remover "${deleteTarget.nome}"? Os produtos não serão excluídos.`
            : ''
        }
        confirmLabel="Remover"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}
