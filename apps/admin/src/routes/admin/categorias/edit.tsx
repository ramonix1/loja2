import { Button, Card } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ApiError, apiFetch } from '../../../lib/api-client';

interface CategoriaDetail {
  id: number;
  nome: string;
  ordem: number;
  produtos: Array<{ id: number; nome: string; categoria_id: number | null }>;
}

function fetchCategoria(id: number) {
  return apiFetch<{ data: CategoriaDetail }>(`/api/v1/admin/categorias/${id}`).then(
    (r) => r.data,
  );
}

export function CategoriaEditPage() {
  const { id } = useParams<{ id: string }>();
  const categoriaId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'categorias', categoriaId],
    queryFn: () => fetchCategoria(categoriaId),
    enabled: Number.isInteger(categoriaId) && categoriaId > 0,
  });

  const [nome, setNome] = useState('');
  const [ordem, setOrdem] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!data) return;
    setNome(data.nome);
    setOrdem(data.ordem);
    setSelectedIds(
      new Set(data.produtos.filter((p) => p.categoria_id === data.id).map((p) => p.id)),
    );
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/v1/admin/categorias/${categoriaId}`, {
        method: 'PUT',
        body: JSON.stringify({
          nome,
          ordem,
          produtos_ids: Array.from(selectedIds),
        }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'categorias'] });
      navigate('/admin/categorias');
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar.');
    },
  });

  function toggleProduto(produtoId: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(produtoId)) next.delete(produtoId);
      else next.add(produtoId);
      return next;
    });
  }

  function toggleTodos(marcar: boolean) {
    if (!data) return;
    setSelectedIds(marcar ? new Set(data.produtos.map((p) => p.id)) : new Set());
  }

  if (isLoading) {
    return <p className="text-gray-400">Carregando…</p>;
  }

  if (isError || !data) {
    return (
      <div>
        <p className="text-red-400">Categoria não encontrada.</p>
        <Link to="/admin/categorias" className="mt-4 inline-block text-sm text-blue-400">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-xs text-gray-500">
        <Link to="/admin/categorias" className="hover:text-gray-300">
          Categorias
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-300">Editar</span>
      </div>
      <h1 className="mb-6 text-2xl font-bold text-white">Editar categoria</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
        className="grid grid-cols-1 gap-8 lg:grid-cols-3"
      >
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Produtos nesta categoria</h2>
            <div className="flex gap-2 text-xs">
              <button type="button" className="text-blue-400 hover:text-blue-300" onClick={() => toggleTodos(true)}>
                Marcar todos
              </button>
              <span className="text-gray-600">·</span>
              <button type="button" className="text-gray-400 hover:text-gray-300" onClick={() => toggleTodos(false)}>
                Desmarcar todos
              </button>
            </div>
          </div>
          {data.produtos.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">Nenhum produto cadastrado ainda.</p>
          ) : (
            <div className="space-y-2">
              {data.produtos.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg p-3 transition hover:bg-gray-800"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggleProduto(p.id)}
                    className="h-4 w-4 shrink-0 rounded accent-blue-500"
                  />
                  <span className="flex-1 text-sm text-gray-300">{p.nome}</span>
                  {p.categoria_id != null && p.categoria_id !== data.id && (
                    <span className="shrink-0 text-xs text-amber-500">(outra categoria)</span>
                  )}
                </label>
              ))}
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-base font-bold text-white">Configurações</h2>
          <div>
            <label htmlFor="edit-nome" className="mb-1.5 block text-sm font-medium text-gray-300">
              Nome da categoria *
            </label>
            <input
              id="edit-nome"
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              data-testid={testIds.adminCategorias.nomeInput}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="edit-ordem" className="mb-1.5 block text-sm font-medium text-gray-300">
              Ordem de exibição
            </label>
            <input
              id="edit-ordem"
              type="number"
              min={0}
              value={ordem}
              onChange={(e) => setOrdem(Number(e.target.value))}
              data-testid={testIds.adminCategorias.ordemInput}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Menor número aparece primeiro na vitrine.</p>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button
            type="submit"
            data-testid={testIds.adminCategorias.formSubmit}
            disabled={saveMutation.isPending}
            className="w-full"
          >
            Salvar
          </Button>
          <Link
            to="/admin/categorias"
            className="block py-2 text-center text-sm text-gray-400 transition hover:text-white"
          >
            Cancelar
          </Link>
        </Card>
      </form>
    </div>
  );
}
