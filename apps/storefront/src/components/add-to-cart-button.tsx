'use client';

import { store as testIds } from '@lojao/test-utils/test-ids/store';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { addToCart, ApiError } from '@/lib/client-api';

interface AddToCartButtonProps {
  produtoId: number;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function AddToCartButton({
  produtoId,
  disabled,
  className,
  label = 'Adicionar ao carrinho',
}: AddToCartButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      await addToCart(produtoId, 1);
      router.push('/carrinho');
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        router.push(`/login?redirect=/produto/${produtoId}`);
        return;
      }
      setError(e instanceof ApiError ? e.message : 'Não foi possível adicionar ao carrinho.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={disabled || loading}
        data-testid={testIds.productAddCartBtn}
        onClick={handleClick}
        className={className ?? 'btn-primary px-8 py-3 text-base disabled:cursor-not-allowed disabled:opacity-50'}
      >
        {loading ? 'Adicionando…' : disabled ? 'Esgotado' : label}
      </button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
