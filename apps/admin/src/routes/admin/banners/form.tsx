import { Button, Card } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ApiError, apiFetch, apiUpload, legacyImageUrl } from '../../../lib/api-client';

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
      if (p) setCtaUrl(`/produto/${p.id}`);
    }
  }

  if (isEdit && isLoading) {
    return <p className="text-gray-400">Carregando…</p>;
  }

  if (isEdit && !isLoading && !banner) {
    return (
      <div>
        <p className="text-red-400">Banner não encontrado.</p>
        <Link to="/admin/banners" className="mt-4 inline-block text-sm text-blue-400">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/admin/banners" className="text-sm text-gray-400 transition hover:text-white">
          Banners
        </Link>
        <h1 className="text-2xl font-bold text-white">
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
        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">
            Imagem do Banner
          </h2>
          {previewUrl && (
            <div className="mb-4 max-h-[200px] overflow-hidden rounded-lg bg-gray-800">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-[200px] w-full object-cover object-center"
              />
            </div>
          )}
          <label className="block cursor-pointer rounded-lg border-2 border-dashed border-gray-700 p-6 text-center transition hover:border-blue-500">
            <p className="text-sm text-gray-400">Clique para selecionar uma imagem</p>
            <p className="mt-1 text-xs text-gray-600">JPG, PNG, WEBP ou GIF — até 5MB</p>
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

        <Card className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-300">Conteúdo</h2>
          <div>
            <label htmlFor="titulo" className="mb-1 block text-sm font-medium text-gray-300">
              Título *
            </label>
            <input
              id="titulo"
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              data-testid={testIds.adminBanners.tituloInput}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="subtitulo" className="mb-1 block text-sm font-medium text-gray-300">
              Subtítulo
            </label>
            <input
              id="subtitulo"
              type="text"
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-300">Botão CTA</h2>
          <div>
            <label htmlFor="cta_texto" className="mb-1 block text-sm font-medium text-gray-300">
              Texto do botão
            </label>
            <input
              id="cta_texto"
              type="text"
              value={ctaTexto}
              onChange={(e) => setCtaTexto(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="produto_id" className="mb-1 block text-sm font-medium text-gray-300">
              Vincular a um produto
            </label>
            <select
              id="produto_id"
              value={produtoId}
              onChange={(e) => handleProdutoChange(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="">Nenhum (usar URL manual)</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cta_url" className="mb-1 block text-sm font-medium text-gray-300">
              URL do CTA
            </label>
            <input
              id="cta_url"
              type="text"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ordem" className="mb-1 block text-sm font-medium text-gray-300">
                Ordem
              </label>
              <input
                id="ordem"
                type="number"
                min={0}
                value={ordem}
                onChange={(e) => setOrdem(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="h-4 w-4 rounded accent-blue-500"
                />
                Banner ativo
              </label>
            </div>
          </div>
        </Card>

        {error && <p className="text-sm text-red-400">{error}</p>}

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
