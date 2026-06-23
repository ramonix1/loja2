'use client';

import { store as testIds } from '@lojao/test-utils/test-ids/store';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { BRL } from '@/lib/api';
import { fetchCheckoutResult, type CheckoutResult } from '@/lib/client-api';
import {
  storeBodyClass,
  storeErrorTextClass,
  storeHeadingClass,
  storeMutedClass,
  storePanelClass,
  storeSectionTitleClass,
  storeSubtleClass,
} from '@/lib/store-styles';
import { useStoreHref } from '@/lib/use-store-href';

interface CheckoutResultViewProps {
  pedidoId: number;
}

export function CheckoutResultView({ pedidoId }: CheckoutResultViewProps) {
  const pedidosHref = useStoreHref('/meus-pedidos');
  const homeHref = useStoreHref('/');
  const [data, setData] = useState<CheckoutResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCheckoutResult(pedidoId)
      .then(setData)
      .catch(() => setError('Pedido não encontrado.'));
  }, [pedidoId]);

  if (error) {
    return <p className={storeErrorTextClass('text-center')}>{error}</p>;
  }

  if (!data) {
    return <p className={storeMutedClass('text-center')}>Carregando…</p>;
  }

  const pago = data.pedido.status === 'pago';

  return (
    <div className="mx-auto max-w-2xl text-center">
      <div
        data-testid={testIds.checkoutSuccessMsg}
        className="rounded-2xl border border-[color-mix(in_srgb,var(--store-success)_35%,transparent)] bg-[color-mix(in_srgb,var(--store-success)_12%,var(--store-surface))] p-8"
      >
        <p className="text-4xl">{pago ? '✓' : '⏳'}</p>
        <h1 className={storeSectionTitleClass('mt-4')}>
          {pago ? 'Pedido confirmado!' : 'Pedido registrado'}
        </h1>
        <p className={storeMutedClass('mt-2')}>
          Pedido <strong>#{data.pedido.id}</strong> — {BRL.format(data.pedido.total)}
        </p>
        <p className={storeSubtleClass('mt-1 text-sm')}>Status: {data.pedido.status}</p>
      </div>

      {data.pixInfo?.copia_cola ? (
        <div className={storePanelClass('mt-6 text-left')}>
          <h2 className={storeHeadingClass()}>PIX copia e cola</h2>
          <p className={storeBodyClass('mt-2 break-all font-mono text-xs')}>{data.pixInfo.copia_cola}</p>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={pedidosHref} className="btn-primary px-6 py-2">
          Meus pedidos
        </Link>
        <Link href={homeHref} className="btn-outline px-6 py-2">
          Continuar comprando
        </Link>
      </div>
    </div>
  );
}
