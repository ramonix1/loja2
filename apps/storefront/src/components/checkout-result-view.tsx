'use client';

import { store as testIds } from '@lojao/test-utils/test-ids/store';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { BRL } from '@/lib/api';
import { fetchCheckoutResult, type CheckoutResult } from '@/lib/client-api';

interface CheckoutResultViewProps {
  pedidoId: number;
}

export function CheckoutResultView({ pedidoId }: CheckoutResultViewProps) {
  const [data, setData] = useState<CheckoutResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCheckoutResult(pedidoId)
      .then(setData)
      .catch(() => setError('Pedido não encontrado.'));
  }, [pedidoId]);

  if (error) {
    return <p className="text-center text-red-600">{error}</p>;
  }

  if (!data) {
    return <p className="text-center text-gray-500">Carregando…</p>;
  }

  const pago = data.pedido.status === 'pago';

  return (
    <div className="mx-auto max-w-2xl text-center">
      <div
        data-testid={testIds.checkoutSuccessMsg}
        className="rounded-2xl border border-green-200 bg-green-50 p-8"
      >
        <p className="text-4xl">{pago ? '✓' : '⏳'}</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          {pago ? 'Pedido confirmado!' : 'Pedido registrado'}
        </h1>
        <p className="mt-2 text-gray-600">
          Pedido <strong>#{data.pedido.id}</strong> — {BRL.format(data.pedido.total)}
        </p>
        <p className="mt-1 text-sm text-gray-500">Status: {data.pedido.status}</p>
      </div>

      {data.pixInfo?.copia_cola ? (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 text-left">
          <h2 className="font-bold">PIX copia e cola</h2>
          <p className="mt-2 break-all font-mono text-xs text-gray-700">{data.pixInfo.copia_cola}</p>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/meus-pedidos" className="btn-primary px-6 py-2">
          Meus pedidos
        </Link>
        <Link href="/" className="btn-outline px-6 py-2">
          Continuar comprando
        </Link>
      </div>
    </div>
  );
}
