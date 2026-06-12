import { Button, Card, cn } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { apiFetch, legacyImageUrl } from '../../../lib/api-client';

interface Banner {
  id: number;
  titulo: string;
  subtitulo: string | null;
  imagem: string;
  cta_texto: string;
  cta_url: string | null;
  produto_id: number | null;
  produto_nome: string | null;
  ativo: boolean;
  ordem: number;
}

function fetchBanners() {
  return apiFetch<{ data: Banner[] }>('/api/v1/admin/banners').then((r) => r.data);
}

export function BannersPage() {
  const queryClient = useQueryClient();

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['admin', 'banners'],
    queryFn: fetchBanners,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/v1/admin/banners/${id}/toggle-ativo`, { method: 'PATCH' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/v1/admin/banners/${id}`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] }),
  });

  function handleDelete(id: number, titulo: string) {
    if (!window.confirm(`Excluir banner "${titulo}"?`)) return;
    deleteMutation.mutate(id);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Banners</h1>
          <p className="mt-1 text-sm text-gray-400">
            Gerencie os banners exibidos no carrossel da página inicial.
          </p>
        </div>
        <Link to="/admin/banners/novo">
          <Button data-testid={testIds.adminBanners.createBtn}>+ Novo Banner</Button>
        </Link>
      </div>

      {isLoading ? (
        <Card className="text-center text-gray-400">Carregando…</Card>
      ) : (
        <div data-testid={testIds.adminBanners.table} className="space-y-4">
          {banners.length === 0 ? (
            <Card
              data-testid={testIds.adminBanners.emptyState}
              className="py-16 text-center text-gray-400"
            >
              <p className="mb-4">Nenhum banner cadastrado.</p>
              <Link to="/admin/banners/novo">
                <Button data-testid={testIds.adminBanners.createBtn}>Criar banner</Button>
              </Link>
            </Card>
          ) : (
            banners.map((banner) => (
              <div
                key={banner.id}
                data-testid={testIds.adminBanners.row(banner.id)}
                className="flex overflow-hidden rounded-xl border border-gray-800 bg-gray-900"
              >
                <div className="w-48 shrink-0 bg-gray-800">
                  <img
                    src={legacyImageUrl(banner.imagem)}
                    alt={banner.titulo}
                    className="h-full max-h-[120px] w-full object-cover object-center"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="mb-1 flex items-center gap-3">
                      <h3 className="text-base font-bold text-white">{banner.titulo}</h3>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-semibold',
                          banner.ativo
                            ? 'bg-green-900 text-green-400'
                            : 'bg-gray-800 text-gray-500',
                        )}
                      >
                        {banner.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    {banner.subtitulo && (
                      <p className="mb-2 text-sm text-gray-400">{banner.subtitulo}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span>
                        CTA: <span className="text-gray-300">{banner.cta_texto}</span>
                      </span>
                      {banner.produto_nome ? (
                        <span>
                          Produto: <span className="text-blue-400">{banner.produto_nome}</span>
                        </span>
                      ) : banner.cta_url ? (
                        <span>
                          URL: <span className="text-gray-300">{banner.cta_url}</span>
                        </span>
                      ) : null}
                      <span>
                        Ordem: <span className="text-gray-300">{banner.ordem}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col justify-center gap-2 p-4">
                  <Link
                    to={`/admin/banners/${banner.id}`}
                    className="rounded-lg bg-gray-800 px-3 py-1.5 text-center text-sm font-medium text-gray-300 transition hover:bg-gray-700 hover:text-white"
                  >
                    Editar
                  </Link>
                  <Button
                    variant="secondary"
                    className="text-xs"
                    onClick={() => toggleMutation.mutate(banner.id)}
                    disabled={toggleMutation.isPending}
                  >
                    {banner.ativo ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    variant="ghost"
                    data-testid={testIds.adminBanners.deleteBtn}
                    className="text-xs text-red-400 hover:bg-red-950 hover:text-red-300"
                    onClick={() => handleDelete(banner.id, banner.titulo)}
                    disabled={deleteMutation.isPending}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
