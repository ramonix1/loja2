'use client';

import { Button, FieldTextarea } from '@lojao/ui';
import { store as testIds } from '@lojao/test-utils/test-ids/store';
import type { PublicProductReview } from '@lojao/types/reviews';
import { useEffect, useState, type FormEvent } from 'react';

import { ProductRating } from '@/components/product-rating';
import {
  ApiError,
  fetchMe,
  fetchOrders,
  fetchProductReviews,
  submitProductReview,
} from '@/lib/client-api';
import {
  storeErrorTextClass,
  storeButtonPillClass,
  storeHeadingClass,
  storeLabelClass,
  storeMutedClass,
  storeSubtleClass,
} from '@/lib/store-styles';

interface ProductReviewsProps {
  productId: number;
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 30) return `${days} dias atrás`;
  return date.toLocaleDateString('pt-BR');
}

function ReviewItem({ review }: { review: PublicProductReview }) {
  return (
    <li className="border-b border-[var(--store-border)] py-4 last:border-0">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <ProductRating summary={{ average: review.rating, count: 1 }} compact />
        <span className={storeMutedClass('text-xs')}>{formatRelativeDate(review.created_at)}</span>
      </div>
      <p className={storeSubtleClass('text-sm font-medium')}>{review.author_name}</p>
      {review.comment ? (
        <p className={storeSubtleClass('mt-2 text-sm leading-relaxed')}>{review.comment}</p>
      ) : null}
    </li>
  );
}

function ProductReviewForm({
  productId,
  onSubmitted,
}: {
  productId: number;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function checkEligibility() {
      const user = await fetchMe();
      if (!user || user.role !== 'usuario') {
        if (!cancelled) setVisible(false);
        return;
      }
      const orders = await fetchOrders();
      const hasDelivered = orders.some((o) => o.status === 'entregue');
      if (!cancelled) setVisible(hasDelivered);
    }
    void checkEligibility();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (!visible) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await submitProductReview(productId, rating, comment.trim() || null);
      setComment('');
      onSubmitted();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.status === 403 || err.status === 409) setVisible(false);
      } else {
        setError('Não foi possível enviar a avaliação.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      data-testid={testIds.productReviewForm}
      onSubmit={handleSubmit}
      className="mt-6 rounded-2xl border border-[var(--store-border)] bg-[var(--store-surface-elevated)] p-4"
    >
      <h3 className={storeHeadingClass('mb-3 text-base')}>Deixe sua avaliação</h3>
      <div className="mb-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <Button
            key={value}
            type="button"
            surface="store"
            variant="ghost"
            data-testid={testIds.productReviewStar(value)}
            aria-label={`${value} estrelas`}
            onClick={() => setRating(value)}
            className={`min-h-0 min-w-0 px-1 py-0 text-2xl leading-none ${value <= rating ? 'text-amber-500' : 'text-[var(--store-border)]'}`}
          >
            ★
          </Button>
        ))}
      </div>
      <label htmlFor="review-comment" className={storeLabelClass('mb-1 block')}>
        Comentário (opcional)
      </label>
      <FieldTextarea
        surface="store"
        id="review-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={1000}
        className="rounded-xl"
      />
      {error ? <p className={storeErrorTextClass('mt-2 text-sm')}>{error}</p> : null}
      <Button
        type="submit"
        surface="store"
        variant="primary"
        disabled={loading}
        className={storeButtonPillClass('mt-4')}
      >
        {loading ? 'Enviando…' : 'Publicar avaliação'}
      </Button>
    </form>
  );
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<PublicProductReview[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadReviews = async (nextPage = 1, append = false) => {
    setLoading(true);
    try {
      const result = await fetchProductReviews(productId, nextPage, 5);
      setReviews((prev) => (append ? [...prev, ...result.reviews] : result.reviews));
      setTotal(result.total);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews(1, false);
  }, [productId]);

  return (
    <section
      id="avaliacoes"
      data-testid={testIds.productReviews}
      className="mt-12 border-t border-[var(--store-border)] pt-10"
    >
      <h2 className={storeHeadingClass('mb-4 text-xl')}>Avaliações</h2>

      {loading && reviews.length === 0 ? (
        <p className={storeMutedClass('text-sm')}>Carregando avaliações…</p>
      ) : reviews.length === 0 ? (
        <p className={storeMutedClass('text-sm')}>Seja o primeiro a avaliar este produto.</p>
      ) : (
        <>
          <ul className="divide-y divide-[var(--store-border)]">{reviews.map((r) => (
            <ReviewItem key={r.id} review={r} />
          ))}</ul>
          {reviews.length < total ? (
            <Button
              type="button"
              surface="store"
              variant="secondary"
              className="btn-pill mt-4"
              disabled={loading}
              onClick={() => void loadReviews(page + 1, true)}
            >
              Ver mais avaliações
            </Button>
          ) : null}
        </>
      )}

      <ProductReviewForm productId={productId} onSubmitted={() => void loadReviews(1, false)} />
    </section>
  );
}
