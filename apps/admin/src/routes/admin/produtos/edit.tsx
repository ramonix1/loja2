import { Button, Card } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ApiError, apiFetch, apiUpload, legacyImageUrl } from '../../../lib/api-client';
import { formatBRL, maskBRLInput, parseBRLInput } from '../../../lib/currency';
import { useImageFilePreviews } from '../../../lib/use-image-file-previews';

interface ProdutoImagem {
  id: number;
  url: string;
}

interface ProdutoDetail {
  id: number;
  nome: string;
  subtitulo: string | null;
  valor: number;
  descricao: string | null;
  estoque: number | null;
  imagens: ProdutoImagem[];
}

function fetchProduto(id: number) {
  return apiFetch<{ data: ProdutoDetail }>(`/api/v1/admin/produtos/${id}`).then((r) => r.data);
}

export function ProdutoEditPage() {
  const { id } = useParams<{ id: string }>();
  const produtoId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [nome, setNome] = useState('');
  const [subtitulo, setSubtitulo] = useState('');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [estoque, setEstoque] = useState('');
  const [novasImagens, setNovasImagens] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const novasImagemPreviews = useImageFilePreviews(novasImagens);

  const { data: produto, isLoading } = useQuery({
    queryKey: ['admin', 'produtos', produtoId],
    queryFn: () => fetchProduto(produtoId),
    enabled: Number.isInteger(produtoId) && produtoId > 0,
  });

  useEffect(() => {
    if (!produto) return;
    setNome(produto.nome);
    setSubtitulo(produto.subtitulo ?? '');
    setValor(formatBRL(produto.valor));
    setDescricao(produto.descricao ?? '');
    setEstoque(produto.estoque !== null && produto.estoque !== undefined ? String(produto.estoque) : '');
  }, [produto]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('nome', nome.trim());
      fd.append('subtitulo', subtitulo);
      fd.append('valor', String(parseBRLInput(valor)));
      fd.append('descricao', descricao);
      if (estoque !== '') fd.append('estoque', estoque);
      for (const file of novasImagens) fd.append('imagens', file);
      return apiUpload(`/api/v1/admin/produtos/${produtoId}`, fd, 'PUT');
    },
    onSuccess: () => {
      setError(null);
      setNovasImagens([]);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'produtos'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'produtos', produtoId] });
      navigate('/admin/produtos');
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar produto.');
    },
  });

  const deleteImagemMutation = useMutation({
    mutationFn: (imagemId: number) =>
      apiFetch(`/api/v1/admin/produtos/imagens/${imagemId}`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'produtos', produtoId] }),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    saveMutation.mutate();
  }

  function removeNovaImagem(index: number) {
    setNovasImagens((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDeleteImagem(imagemId: number) {
    if (!window.confirm('Remover esta imagem?')) return;
    deleteImagemMutation.mutate(imagemId);
  }

  if (isLoading || !produto) {
    return <Card className="text-center text-gray-400">Carregando…</Card>;
  }

  return (
    <div>
      <div className="mb-6 text-xs text-gray-500">
        <Link to="/admin/produtos" className="hover:text-gray-300">
          Produtos
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-300">Editar</span>
      </div>
      <h1 className="mb-1 text-2xl font-bold text-white">Editar produto</h1>
      <p className="mb-6 text-sm text-gray-400">{produto.nome}</p>

      {error && (
        <div className="mb-4 rounded-xl border border-red-700 bg-red-900/50 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Nome *</label>
            <input
              data-testid={testIds.adminProdutos.editNomeInput}
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
              type="text"
              value={valor}
              onChange={(e) => setValor(maskBRLInput(e.target.value))}
              required
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Estoque</label>
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
              rows={4}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Imagens atuais</label>
            {produto.imagens.length === 0 ? (
              <p className="mb-3 text-sm text-gray-500">Nenhuma imagem cadastrada.</p>
            ) : (
              <div className="mb-3 flex flex-wrap gap-2">
                {produto.imagens.map((img) => (
                  <div key={img.id} className="group relative">
                    <img
                      src={legacyImageUrl(img.url)}
                      alt=""
                      className="h-20 w-20 rounded-lg border border-gray-700 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteImagem(img.id)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white opacity-0 transition group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Adicionar novas imagens
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) =>
                setNovasImagens((prev) => [...prev, ...Array.from(e.target.files ?? [])])
              }
              className="block w-full text-sm text-gray-400 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
            />
            {novasImagemPreviews.length > 0 ? (
              <div
                data-testid={testIds.adminProdutos.imagensPreview}
                className="mt-3 flex flex-wrap gap-2"
              >
                {novasImagemPreviews.map((item, index) => (
                  <div
                    key={`${item.file.name}-${index}`}
                    className="group relative"
                    data-testid={testIds.adminProdutos.imagensPreviewItem(index)}
                  >
                    <img
                      src={item.url}
                      alt=""
                      className="h-20 w-20 rounded-lg border border-gray-700 object-cover"
                    />
                    <button
                      type="button"
                      aria-label="Remover imagem"
                      onClick={() => removeNovaImagem(index)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white opacity-0 transition group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex gap-3 border-t border-gray-800 pt-6">
            <Button
              type="submit"
              data-testid={testIds.adminProdutos.editSubmit}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Salvando…' : 'Salvar alterações'}
            </Button>
            <Link
              to="/admin/produtos"
              className="rounded-lg bg-gray-700 px-6 py-2.5 text-sm text-gray-300 hover:bg-gray-600"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
