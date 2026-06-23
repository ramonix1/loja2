import {
  Button,
  Card,
  FieldInput,
  FieldTextarea,
  ConfirmDialog,
  adminFieldLabelClass,
  adminFileInputClass,
  adminMutedClass,
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminSubtleClass,
  cn,
} from '@lojao/ui';
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
  const [deleteImagemId, setDeleteImagemId] = useState<number | null>(null);
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
    setDeleteImagemId(imagemId);
  }

  if (isLoading || !produto) {
    return (
      <Card surface="admin" className={cn('text-center', adminMutedClass())}>
        Carregando…
      </Card>
    );
  }

  return (
    <div>
      <div className={cn('mb-6 text-xs', adminSubtleClass())}>
        <Link to="/admin/produtos" className="ds-link hover:opacity-80">
          Produtos
        </Link>
        <span className="mx-2">/</span>
        <span className={adminMutedClass()}>Editar</span>
      </div>
      <h1 className={adminPageTitleClass('mb-1')}>Editar produto</h1>
      <p className={adminPageSubtitleClass('mb-6')}>{produto.nome}</p>

      {error && (
        <div className="ds-alert-error mb-4 text-sm">{error}</div>
      )}

      <Card surface="admin" className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={adminFieldLabelClass()}>Nome *</label>
            <FieldInput
              data-testid={testIds.adminProdutos.editNomeInput}
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={adminFieldLabelClass()}>Subtítulo</label>
            <FieldInput
              type="text"
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
            />
          </div>
          <div>
            <label className={adminFieldLabelClass()}>Valor *</label>
            <FieldInput
              type="text"
              value={valor}
              onChange={(e) => setValor(maskBRLInput(e.target.value))}
              required
            />
          </div>
          <div>
            <label className={adminFieldLabelClass()}>Estoque</label>
            <FieldInput
              type="number"
              min={0}
              value={estoque}
              onChange={(e) => setEstoque(e.target.value)}
              placeholder="Deixe em branco para ilimitado"
            />
          </div>
          <div>
            <label className={adminFieldLabelClass()}>Descrição</label>
            <FieldTextarea
              rows={4}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="resize-none"
            />
          </div>

          <div>
            <label className={cn(adminFieldLabelClass(), 'mb-2')}>Imagens atuais</label>
            {produto.imagens.length === 0 ? (
              <p className={cn('mb-3 text-sm', adminSubtleClass())}>Nenhuma imagem cadastrada.</p>
            ) : (
              <div className="mb-3 flex flex-wrap gap-2">
                {produto.imagens.map((img) => (
                  <div key={img.id} className="group relative">
                    <img
                      src={legacyImageUrl(img.url)}
                      alt=""
                      className="h-20 w-20 rounded-lg border border-[var(--admin-border)] object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteImagem(img.id)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--admin-error)] text-xs text-[var(--admin-text)] opacity-0 transition group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className={adminFieldLabelClass()}>Adicionar novas imagens</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) =>
                setNovasImagens((prev) => [...prev, ...Array.from(e.target.files ?? [])])
              }
              className={adminFileInputClass()}
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
                      className="h-20 w-20 rounded-lg border border-[var(--admin-border)] object-cover"
                    />
                    <button
                      type="button"
                      aria-label="Remover imagem"
                      onClick={() => removeNovaImagem(index)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--admin-error)] text-xs text-[var(--admin-text)] opacity-0 transition group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex gap-3 border-t border-[var(--admin-border)] pt-6">
            <Button
              type="submit"
              data-testid={testIds.adminProdutos.editSubmit}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Salvando…' : 'Salvar alterações'}
            </Button>
            <Link to="/admin/produtos">
              <Button variant="secondary">Cancelar</Button>
            </Link>
          </div>
        </form>
      </Card>

      <ConfirmDialog
        open={deleteImagemId != null}
        onOpenChange={(open) => !open && setDeleteImagemId(null)}
        title="Remover imagem"
        description="Esta ação remove a imagem do produto permanentemente."
        confirmLabel="Remover"
        destructive
        loading={deleteImagemMutation.isPending}
        onConfirm={() => {
          if (deleteImagemId != null) deleteImagemMutation.mutate(deleteImagemId);
        }}
      />
    </div>
  );
}
