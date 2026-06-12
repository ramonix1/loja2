import { Button, Card, cn } from '@lojao/ui';
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
    if (!window.confirm(`Remover categoria "${nomeCat}"? Os produtos não serão excluídos.`)) return;
    deleteMutation.mutate(id);
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-white">Categorias</h1>
      <p className="mb-6 text-sm text-gray-400">
        Agrupe produtos em seções exibidas na vitrine.
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isLoading ? (
            <Card className="text-center text-gray-400">Carregando…</Card>
          ) : (
            <div data-testid={testIds.adminCategorias.table} className="space-y-3">
              {categorias.length === 0 ? (
                <Card
                  data-testid={testIds.adminCategorias.emptyState}
                  className="py-12 text-center text-gray-400"
                >
                  Nenhuma categoria criada ainda. Use o formulário ao lado para criar a primeira.
                </Card>
              ) : (
              categorias.map((cat) => (
                <div
                  key={cat.id}
                  data-testid={testIds.adminCategorias.row(cat.id)}
                  className="flex items-center justify-between gap-4 rounded-xl border border-gray-800 bg-gray-900 p-5"
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-white">{cat.nome}</div>
                    <div className="mt-0.5 text-xs text-gray-400">
                      {cat.total_produtos} produto{cat.total_produtos !== 1 ? 's' : ''}
                      {cat.ordem > 0 ? ` · ordem ${cat.ordem}` : ''}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      to={`/admin/categorias/${cat.id}`}
                      className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-300 transition hover:bg-gray-700 hover:text-white"
                    >
                      Editar
                    </Link>
                    <Button
                      variant="ghost"
                      data-testid={testIds.adminCategorias.deleteBtn}
                      className={cn('text-red-400 hover:bg-red-950 hover:text-red-300')}
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

        <Card>
          <h2 className="mb-4 text-base font-bold text-white">Nova categoria</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="cat-nome" className="mb-1.5 block text-sm font-medium text-gray-300">
                Nome *
              </label>
              <input
                id="cat-nome"
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                data-testid={testIds.adminCategorias.nomeInput}
                placeholder="Ex: Calçados, Roupas…"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
            {createError && (
              <p className="text-sm text-red-400">{createError}</p>
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
    </div>
  );
}
