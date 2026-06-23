import {
  Button,
  Card,
  FieldInput,
  FieldNativeSelect,
  Checkbox,
  adminFieldLabelClass,
  adminMutedClass,
  adminPageTitleClass,
  adminSectionTitleClass,
  adminSubtleClass,
  cn,
} from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ApiError, apiFetch, apiUpload, legacyImageUrl, storefrontStorePath } from '../../../lib/api-client';

interface ProdutoOption {
  id: number;
  nome: string;
}

interface BannerDetail {
  id: number;
  titulo: string;
  subtitulo: string | null;
  imagem: string;
  cta_texto: string;
  cta_url: string | null;
  produto_id: number | null;
  ativo: boolean;
  ordem: number;
}

function fetchFormOptions() {
  return apiFetch<{ data: { produtos: ProdutoOption[] } }>(
    '/api/v1/admin/banners/form-options',
  ).then((r) => r.data.produtos);
}

function fetchBanner(id: number) {
  return apiFetch<{ data: BannerDetail }>(`/api/v1/admin/banners/${id}`).then((r) => r.data);
}

export function BannerFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id != null && id !== 'novo';
  const bannerId = isEdit ? Number(id) : null;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [titulo, setTitulo] = useState('');
  const [subtitulo, setSubtitulo] = useState('');
  const [ctaTexto, setCtaTexto] = useState('Ver oferta');
  const [ctaUrl, setCtaUrl] = useState('');
  const [produtoId, setProdutoId] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [ordem, setOrdem] = useState(0);
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: produtos = [] } = useQuery({
    queryKey: ['admin', 'banners', 'form-options'],
    queryFn: fetchFormOptions,
  });

  const { data: banner, isLoading } = useQuery({
    queryKey: ['admin', 'banners', bannerId],
    queryFn: () => fetchBanner(bannerId!),
    enabled: isEdit && Number.isInteger(bannerId) && bannerId! > 0,
  });

  useEffect(() => {
    if (!banner) return;
    setTitulo(banner.titulo);
    setSubtitulo(banner.subtitulo ?? '');
    setCtaTexto(banner.cta_texto || 'Ver oferta');
    setCtaUrl(banner.cta_url ?? '');
    setProdutoId(banner.produto_id?.toString() ?? '');
    setAtivo(banner.ativo);
    setOrdem(banner.ordem);
    setPreviewUrl(legacyImageUrl(banner.imagem));
  }, [banner]);

  useEffect(() => {
    if (!imagemFile) return;
    const url = URL.createObjectURL(imagemFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imagemFile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append('titulo', titulo);
      if (subtitulo) form.append('subtitulo', subtitulo);
      form.append('cta_texto', ctaTexto);
      if (ctaUrl) form.append('cta_url', ctaUrl);
      if (produtoId) form.append('produto_id', produtoId);
      form.append('ativo', String(ativo));
      form.append('ordem', String(ordem));
      if (imagemFile) form.append('imagem', imagemFile);

      if (isEdit && bannerId) {
        return apiUpload(`/api/v1/admin/banners/${bannerId}`, form, 'PUT');
      }
      if (!imagemFile) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Imagem obrigatória para o banner.');
      }
      return apiUpload('/api/v1/admin/banners', form, 'POST');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      navigate('/admin/banners');
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar banner.');
    },
  });

  function handleProdutoChange(value: string) {
    setProdutoId(value);
    if (value) {
      const p = produtos.find((x) => x.id === Number(value));
      if (p) setCtaUrl(storefrontStorePath(`/produto/${p.id}`));
    }
  }

  if (isEdit && isLoading) {
    return <p className={adminMutedClass()}>Carregando…</p>;
  }

  if (isEdit && !isLoading && !banner) {
    return (
      <div>
        <p className="ds-alert-error">Banner não encontrado.</p>
        <Link to="/admin/banners" className="ds-link mt-4 inline-block text-sm">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/admin/banners" className={cn('ds-link text-sm', adminMutedClass())}>
          Banners
        </Link>
        <h1 className={adminPageTitleClass()}>
          {isEdit ? 'Editar Banner' : 'Novo Banner'}
        </h1>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
        className="max-w-2xl space-y-6"
      >
        <Card surface="admin">
          <h2 className={cn(adminSectionTitleClass('mb-4 text-sm uppercase tracking-wider'), adminMutedClass())}>
            Imagem do Banner
          </h2>
          {previewUrl && (
            <div className="mb-4 max-h-[200px] overflow-hidden rounded-lg bg-[var(--admin-surface-elevated)]">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-[200px] w-full object-cover object-center"
              />
            </div>
          )}
          <label className="block cursor-pointer rounded-lg border-2 border-dashed border-[var(--admin-border)] p-6 text-center transition hover:border-[var(--admin-accent)]">
            <p className={cn('text-sm', adminMutedClass())}>Clique para selecionar uma imagem</p>
            <p className={cn('mt-1 text-xs', adminSubtleClass())}>JPG, PNG, WEBP ou GIF — até 5MB</p>
            <input
              type="file"
              accept="image/*"
              required={!isEdit}
              data-testid={testIds.adminBanners.imagemInput}
              className="hidden"
              onChange={(e) => setImagemFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </Card>

        <Card surface="admin" className="space-y-4">
          <h2 className={cn(adminSectionTitleClass('text-sm uppercase tracking-wider'), adminMutedClass())}>
            Conteúdo
          </h2>
          <div>
            <label htmlFor="titulo" className={adminFieldLabelClass()}>
              Título *
            </label>
            <FieldInput
              id="titulo"
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              data-testid={testIds.adminBanners.tituloInput}
            />
          </div>
          <div>
            <label htmlFor="subtitulo" className={adminFieldLabelClass()}>
              Subtítulo
            </label>
            <FieldInput
              id="subtitulo"
              type="text"
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
            />
          </div>
        </Card>

        <Card surface="admin" className="space-y-4">
          <h2 className={cn(adminSectionTitleClass('text-sm uppercase tracking-wider'), adminMutedClass())}>
            Botão CTA
          </h2>
          <div>
            <label htmlFor="cta_texto" className={adminFieldLabelClass()}>
              Texto do botão
            </label>
            <FieldInput
              id="cta_texto"
              type="text"
              value={ctaTexto}
              onChange={(e) => setCtaTexto(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="produto_id" className={adminFieldLabelClass()}>
              Vincular a um produto
            </label>
            <FieldNativeSelect
              id="produto_id"
              value={produtoId}
              onChange={(e) => handleProdutoChange(e.target.value)}
            >
              <option value="">Nenhum (usar URL manual)</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </FieldNativeSelect>
          </div>
          <div>
            <label htmlFor="cta_url" className={adminFieldLabelClass()}>
              URL do CTA
            </label>
            <FieldInput
              id="cta_url"
              type="text"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ordem" className={adminFieldLabelClass()}>
                Ordem
              </label>
              <FieldInput
                id="ordem"
                type="number"
                min={0}
                value={ordem}
                onChange={(e) => setOrdem(Number(e.target.value))}
              />
            </div>
            <div className="flex items-end pb-1">
              <label className={cn('flex cursor-pointer items-center gap-2 text-sm', adminMutedClass())}>
                <Checkbox
                  checked={ativo}
                  onCheckedChange={(checked) => setAtivo(checked === true)}
                />
                Banner ativo
              </label>
            </div>
          </div>
        </Card>

        {error && <p className="ds-alert-error text-sm">{error}</p>}

        <Button
          type="submit"
          data-testid={testIds.adminBanners.formSubmit}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </form>
    </div>
  );
}
