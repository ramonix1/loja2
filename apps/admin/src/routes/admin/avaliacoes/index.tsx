import {
  Button,
  Card,
  StatusBadge,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  adminEmptyStateClass,
  adminMutedClass,
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminSubtleClass,
} from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import type { AdminReview } from '@lojao/types/reviews';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import { apiFetch } from '../../../lib/api-client';

interface ReviewsResponse {
  data: AdminReview[];
  meta: { page: number; perPage: number; total: number };
}

function fetchReviews(status: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}&limit=50` : '?limit=50';
  return apiFetch<ReviewsResponse>(`/api/v1/admin/reviews${qs}`);
}

function rejectReview(id: number) {
  return apiFetch<{ data: AdminReview }>(`/api/v1/admin/reviews/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'rejected' }),
  });
}

export function AvaliacoesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? 'approved';
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'reviews', status],
    queryFn: () => fetchReviews(status),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectReview,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
    },
  });

  const reviews = data?.data ?? [];

  return (
    <div data-testid={testIds.adminAvaliacoes.panel}>
      <h1 className={adminPageTitleClass()}>Avaliações</h1>
      <p className={adminPageSubtitleClass()}>Modere as avaliações publicadas na vitrine.</p>

      <div className="mb-4 flex flex-wrap gap-2" data-testid={testIds.adminAvaliacoes.filterStatus}>
        {(['approved', 'rejected', 'pending'] as const).map((value) => (
          <Button
            key={value}
            type="button"
            variant={status === value ? 'primary' : 'secondary'}
            onClick={() => setSearchParams(value === 'approved' ? {} : { status: value })}
          >
            {value === 'approved' ? 'Aprovadas' : value === 'rejected' ? 'Rejeitadas' : 'Pendentes'}
          </Button>
        ))}
      </div>

      <Card surface="admin" className="overflow-hidden">
        {isLoading ? (
          <p className={adminMutedClass('p-6')}>Carregando…</p>
        ) : isError ? (
          <p className={adminMutedClass('p-6')}>Erro ao carregar avaliações.</p>
        ) : reviews.length === 0 ? (
          <p className={adminEmptyStateClass()} data-testid={testIds.adminAvaliacoes.emptyState}>
            Nenhuma avaliação neste filtro.
          </p>
        ) : (
          <Table data-testid={testIds.adminAvaliacoes.table}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Produto</TableHeaderCell>
                <TableHeaderCell>Cliente</TableHeaderCell>
                <TableHeaderCell>Nota</TableHeaderCell>
                <TableHeaderCell>Comentário</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Ações</TableHeaderCell>
              </TableRow>
            </TableHead>
            <tbody>
              {reviews.map((review) => (
                <TableRow
                  key={review.id}
                  data-testid={testIds.adminAvaliacoes.row(review.id)}
                >
                  <TableCell>{review.product_name}</TableCell>
                  <TableCell>{review.buyer_name}</TableCell>
                  <TableCell>{review.rating} ★</TableCell>
                  <TableCell className={adminSubtleClass('max-w-xs truncate')}>
                    {review.comment ?? '—'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={
                        review.status === 'approved'
                          ? 'entregue'
                          : review.status === 'rejected'
                            ? 'cancelado'
                            : 'aguardando_pagamento'
                      }
                    >
                      {review.status}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    {review.status === 'approved' ? (
                      <Button
                        type="button"
                        variant="secondary"
                        data-testid={testIds.adminAvaliacoes.rejectBtn(review.id)}
                        disabled={rejectMutation.isPending}
                        onClick={() => rejectMutation.mutate(review.id)}
                      >
                        Rejeitar
                      </Button>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
