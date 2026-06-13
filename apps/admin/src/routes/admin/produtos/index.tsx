import { Button, Card, cn } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { ApiError, apiFetch, apiUpload, legacyImageUrl } from '../../../lib/api-client';
import { formatBRL, maskBRLInput, parseBRLInput } from '../../../lib/currency';

interface Produto {
  id: number;
  nome: string;
  subtitulo: string | null;
  valor: number;
  estoque: number | null;
  primeira_imagem: string | null;
}

function fetchProdutos() {
  return apiFetch<{ data: Produto[] }>('/api/v1/admin/produtos').then((r) => r.data);
}

const STOREFRONT_URL = (import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '');

export function ProdutosPage() {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [subtitulo, setSubtitulo] = useState('');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [estoque, setEstoque] = useState('');
  const [imagens, setImagens] = useState<File[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ['admin', 'produtos'],
    queryFn: fetchProdutos,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('nome', nome.trim());
      if (subtitulo) fd.append('subtitulo', subtitulo);
      fd.append('valor', String(parseBRLInput(valor)));
      if (descricao) fd.append('descricao', descricao);
      if (estoque !== '') fd.append('estoque', estoque);
      for (const file of imagens) fd.append('imagens', file);
      return apiUpload<{ data: { id: number } }>('/api/v1/admin/produtos', fd);
    },
    onSuccess: () => {
      setNome('');
      setSubtitulo('');
      setValor('');
      setDescricao('');
      setEstoque('');
      setImagens([]);
      setCreateError(null);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'produtos'] });
    },
    onError: (err) => {
      setCreateError(err instanceof ApiError ? err.message : 'Erro ao criar produto.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/v1/admin/produtos/${id}`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'produtos'] }),
  });

  const estoqueMutation = useMutation({
    mutationFn: ({ id, estoqueVal }: { id: number; estoqueVal: number | null }) =>
      apiFetch(`/api/v1/admin/produtos/${id}/estoque`, {
        method: 'PATCH',
        body: JSON.stringify({ estoque: estoqueVal }),
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'produtos'] }),
  });

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim() || imagens.length === 0) {
      setCreateError('Nome e pelo menos uma imagem são obrigatórios.');
      return;
    }
    createMutation.mutate();
  }

  function handleDelete(id: number, nomeProd: string) {
    if (!window.confirm(`Excluir produto "${nomeProd}" permanentemente?`)) return;
    deleteMutation.mutate(id);
  }

  function estoqueLabel(q: number | null) {
    if (q === null || q === undefined) return 'Ilimitado';
    if (q === 0) return 'Esgotado';
    if (q <= 5) return 'Poucas unidades';
    return `${q} em estoque`;
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-white">Produtos</h1>
      <p className="mb-6 text-sm text-gray-400">Cadastre, edite e remova produtos da loja.</p>

      <Card className="mb-8 max-w-2xl">
        <h2 className="mb-4 text-lg font-bold text-white">Cadastrar novo produto</h2>
        {createError && (
          <p className="mb-4 text-sm text-red-400">{createError}</p>
        )}
        <form data-testid={testIds.adminProdutos.createForm} onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Nome *</label>
            <input
              data-testid={testIds.adminProdutos.nomeInput}
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Subtítulo</label>
            <input
              type="text"
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Valor *</label>
            <input
              data-testid={testIds.adminProdutos.valorInput}
              type="text"
              value={valor}
              onChange={(e) => setValor(maskBRLInput(e.target.value))}
              placeholder="R$ 0,00"
              required
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Estoque inicial</label>
            <input
              type="number"
              min={0}
              value={estoque}
              onChange={(e) => setEstoque(e.target.value)}
              placeholder="Deixe em branco para ilimitado"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Descrição</label>
            <textarea
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Imagens *</label>
            <input
              data-testid={testIds.adminProdutos.imagensInput}
              type="file"
              accept="image/*"
              multiple
              required
              onChange={(e) => setImagens(Array.from(e.target.files ?? []))}
              className="block w-full text-sm text-gray-400 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
            />
          </div>
          <Button
            type="submit"
            data-testid={testIds.adminProdutos.formSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Salvando…' : 'Salvar produto'}
          </Button>
        </form>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Produtos cadastrados</h2>
          <span className="text-sm text-gray-400">{produtos.length} produto(s)</span>
        </div>

        {isLoading ? (
          <p className="text-center text-gray-400">Carregando…</p>
        ) : (
          <div data-testid={testIds.adminProdutos.table}>
            {produtos.length === 0 ? (
              <div
                data-testid={testIds.adminProdutos.emptyState}
                className="py-12 text-center text-gray-400"
              >
                Nenhum produto cadastrado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-left text-xs uppercase tracking-wider text-gray-500">
                      <th className="pb-3 pr-4">Produto</th>
                      <th className="pb-3 pr-4">Valor</th>
                      <th className="pb-3 pr-4">Estoque</th>
                      <th className="pb-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {produtos.map((p) => (
                      <tr
                        key={p.id}
                        data-testid={testIds.adminProdutos.row(p.id)}
                        className="hover:bg-gray-800/40"
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                p.primeira_imagem
                                  ? legacyImageUrl(p.primeira_imagem)
                                  : 'https://placehold.co/40x40/374151/9ca3af?text=?'
                              }
                              alt=""
                              className="h-10 w-10 rounded-lg border border-gray-700 object-cover"
                            />
                            <div>
                              <div className="font-medium text-white">{p.nome}</div>
                              {p.subtitulo && (
                                <div className="text-xs text-gray-500">{p.subtitulo}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-semibold text-green-400">
                          {formatBRL(p.valor)}
                        </td>
                        <td className="py-3 pr-4">
                          <form
                            className="flex items-center gap-2"
                            onSubmit={(e) => {
                              e.preventDefault();
                              const input = (e.currentTarget.elements.namedItem('estoque') as HTMLInputElement).value;
                              const val = input === '' ? null : Math.max(0, parseInt(input, 10));
                              estoqueMutation.mutate({ id: p.id, estoqueVal: val });
                            }}
                          >
                            <input
                              name="estoque"
                              type="number"
                              min={0}
                              defaultValue={p.estoque ?? ''}
                              placeholder="∞"
                              className={cn(
                                'w-20 rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-center text-sm text-white focus:border-blue-500 focus:outline-none',
                                p.estoque === 0 && 'border-red-700 text-red-400',
                                p.estoque !== null && p.estoque > 0 && p.estoque <= 5 && 'border-yellow-700 text-yellow-400',
                              )}
                            />
                            <button
                              type="submit"
                              className="rounded-lg bg-gray-700 px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-600"
                            >
                              ✓
                            </button>
                          </form>
                          <div
                            className={cn(
                              'mt-0.5 text-xs',
                              p.estoque === null && 'text-gray-600',
                              p.estoque === 0 && 'font-semibold text-red-500',
                              p.estoque !== null && p.estoque > 0 && p.estoque <= 5 && 'text-yellow-500',
                              p.estoque !== null && p.estoque > 5 && 'text-gray-600',
                            )}
                          >
                            {estoqueLabel(p.estoque)}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <a
                              href={`${STOREFRONT_URL}/produto/${p.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg bg-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-600"
                            >
                              Ver
                            </a>
                            <Link
                              to={`/admin/produtos/${p.id}`}
                              className="rounded-lg bg-yellow-600 px-3 py-1.5 text-xs text-white hover:bg-yellow-500"
                            >
                              Editar
                            </Link>
                            <button
                              type="button"
                              data-testid={testIds.adminProdutos.deleteBtn}
                              onClick={() => handleDelete(p.id, p.nome)}
                              className="rounded-lg bg-red-700 px-3 py-1.5 text-xs text-white hover:bg-red-600"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
