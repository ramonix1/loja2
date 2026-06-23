import {
  Button,
  Card,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  FieldInput,
  FieldTextarea,
  ConfirmDialog,
  adminEmptyStateClass,
  adminFieldLabelClass,
  adminFileInputClass,
  adminMutedClass,
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminSectionTitleClass,
  adminSubtleClass,
  cn,
} from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { ApiError, apiFetch, apiUpload, legacyImageUrl, storefrontProductUrl } from '../../../lib/api-client';
import { formatBRL, maskBRLInput, parseBRLInput } from '../../../lib/currency';
import { useImageFilePreviews } from '../../../lib/use-image-file-previews';

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

export function ProdutosPage() {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [subtitulo, setSubtitulo] = useState('');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [estoque, setEstoque] = useState('');
  const [imagens, setImagens] = useState<File[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; nome: string } | null>(null);
  const imagemPreviews = useImageFilePreviews(imagens);

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

  function removeImagem(index: number) {
    setImagens((prev) => prev.filter((_, i) => i !== index));
  }

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim() || imagens.length === 0) {
      setCreateError('Nome e pelo menos uma imagem são obrigatórios.');
      return;
    }
    createMutation.mutate();
  }

  function handleDelete(id: number, nomeProd: string) {
    setDeleteTarget({ id, nome: nomeProd });
  }

  function estoqueLabel(q: number | null) {
    if (q === null || q === undefined) return 'Ilimitado';
    if (q === 0) return 'Esgotado';
    if (q <= 5) return 'Poucas unidades';
    return `${q} em estoque`;
  }

  return (
    <div>
      <h1 className={adminPageTitleClass('mb-1')}>Produtos</h1>
      <p className={adminPageSubtitleClass('mb-6')}>Cadastre, edite e remova produtos da loja.</p>

      <Card surface="admin" className="mb-8 max-w-2xl">
        <h2 className={adminSectionTitleClass('mb-4 text-lg')}>Cadastrar novo produto</h2>
        {createError && (
          <p className="ds-alert-error mb-4 text-sm">{createError}</p>
        )}
        <form data-testid={testIds.adminProdutos.createForm} onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className={adminFieldLabelClass()}>Nome *</label>
            <FieldInput
              data-testid={testIds.adminProdutos.nomeInput}
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={adminFieldLabelClass()}>Subtítulo</label>
            <FieldInput type="text" value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} />
          </div>
          <div>
            <label className={adminFieldLabelClass()}>Valor *</label>
            <FieldInput
              data-testid={testIds.adminProdutos.valorInput}
              type="text"
              value={valor}
              onChange={(e) => setValor(maskBRLInput(e.target.value))}
              placeholder="R$ 0,00"
              required
            />
          </div>
          <div>
            <label className={adminFieldLabelClass()}>Estoque inicial</label>
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
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="resize-none"
            />
          </div>
          <div>
            <label className={adminFieldLabelClass()}>Imagens *</label>
            <input
              data-testid={testIds.adminProdutos.imagensInput}
              type="file"
              accept="image/*"
              multiple
              required={imagens.length === 0}
              onChange={(e) => setImagens((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
              className={adminFileInputClass()}
            />
            {imagemPreviews.length > 0 ? (
              <div
                data-testid={testIds.adminProdutos.imagensPreview}
                className="mt-3 flex flex-wrap gap-2"
              >
                {imagemPreviews.map((item, index) => (
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
                      onClick={() => removeImagem(index)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--admin-error)] text-xs text-[var(--admin-text)] opacity-0 transition group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
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

      <Card surface="admin">
        <div className="mb-4 flex items-center justify-between">
          <h2 className={adminSectionTitleClass('text-lg')}>Produtos cadastrados</h2>
          <span className={adminPageSubtitleClass()}>{produtos.length} produto(s)</span>
        </div>

        {isLoading ? (
          <p className={cn('text-center', adminMutedClass())}>Carregando…</p>
        ) : (
          <div data-testid={testIds.adminProdutos.table}>
            {produtos.length === 0 ? (
              <div
                data-testid={testIds.adminProdutos.emptyState}
                className={adminEmptyStateClass('py-12')}
              >
                Nenhum produto cadastrado.
              </div>
            ) : (
              <Table surface="admin">
                <TableHead surface="admin">
                  <TableRow surface="admin">
                    <TableHeaderCell>Produto</TableHeaderCell>
                    <TableHeaderCell>Valor</TableHeaderCell>
                    <TableHeaderCell>Estoque</TableHeaderCell>
                    <TableHeaderCell>Ações</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <tbody>
                  {produtos.map((p) => (
                    <TableRow
                      key={p.id}
                      surface="admin"
                      data-testid={testIds.adminProdutos.row(p.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              p.primeira_imagem
                                ? legacyImageUrl(p.primeira_imagem)
                                : 'https://placehold.co/40x40/374151/9ca3af?text=?'
                            }
                            alt=""
                            className="h-10 w-10 rounded-lg border border-[var(--admin-border)] object-cover"
                          />
                          <div>
                            <div className="font-medium text-[var(--admin-text)]">{p.nome}</div>
                            {p.subtitulo && (
                              <div className={cn('text-xs', adminSubtleClass())}>{p.subtitulo}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-[var(--admin-success)]">
                        {formatBRL(p.valor)}
                      </TableCell>
                      <TableCell>
                        <form
                          className="flex items-center gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const input = (e.currentTarget.elements.namedItem('estoque') as HTMLInputElement).value;
                            const val = input === '' ? null : Math.max(0, parseInt(input, 10));
                            estoqueMutation.mutate({ id: p.id, estoqueVal: val });
                          }}
                        >
                          <FieldInput
                            name="estoque"
                            type="number"
                            min={0}
                            defaultValue={p.estoque ?? ''}
                            placeholder="∞"
                            className={cn(
                              'w-20 px-2 py-1.5 text-center',
                              p.estoque === 0 && 'border-[var(--admin-error)] text-[var(--admin-error-text)]',
                              p.estoque !== null &&
                                p.estoque > 0 &&
                                p.estoque <= 5 &&
                                'border-[var(--admin-warning)] text-[var(--admin-warning-text)]',
                            )}
                          />
                          <Button type="submit" variant="secondary" className="px-2 py-1.5 text-xs">
                            ✓
                          </Button>
                        </form>
                        <div
                          className={cn(
                            'mt-0.5 text-xs',
                            p.estoque === null && adminSubtleClass(),
                            p.estoque === 0 && 'font-semibold text-[var(--admin-error-text)]',
                            p.estoque !== null && p.estoque > 0 && p.estoque <= 5 && 'text-[var(--admin-warning-text)]',
                            p.estoque !== null && p.estoque > 5 && adminSubtleClass(),
                          )}
                        >
                          {estoqueLabel(p.estoque)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <a
                            href={storefrontProductUrl(p.id)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Button variant="secondary" className="text-xs">
                              Ver
                            </Button>
                          </a>
                          <Link to={`/admin/produtos/${p.id}`}>
                            <Button variant="secondary" className="text-xs">
                              Editar
                            </Button>
                          </Link>
                          <Button
                            type="button"
                            variant="ghost"
                            data-testid={testIds.adminProdutos.deleteBtn}
                            onClick={() => handleDelete(p.id, p.nome)}
                            className="text-xs text-[var(--admin-error-text)] hover:bg-[var(--admin-error-bg)]"
                          >
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir produto"
        description={
          deleteTarget
            ? `Excluir "${deleteTarget.nome}" permanentemente? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}
