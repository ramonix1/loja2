'use client';

import { store as testIds } from '@lojao/test-utils/test-ids/store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BRL } from '@/lib/api';
import { fetchOrders, type BuyerOrder } from '@/lib/client-api';

const STATUS_LABELS: Record<string, string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  em_separacao: 'Em separação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

export function OrdersList() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders()
      .then(setPedidos)
      .catch(() => router.push('/login?redirect=/meus-pedidos'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <p className="text-center text-gray-500">Carregando pedidos…</p>;

  if (pedidos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
        <p className="text-gray-600">Você ainda não fez nenhum pedido.</p>
        <Link href="/" className="btn-primary mt-4 inline-block">
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div data-testid={testIds.ordersTable} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-gray-50 text-gray-600">
          <tr>
            <th className="px-4 py-3">Pedido</th>
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Itens</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p) => (
            <tr key={p.id} data-testid={testIds.orderRow(p.id)} className="border-b last:border-0">
              <td className="px-4 py-4 font-semibold">#{p.id}</td>
              <td className="px-4 py-4">{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
              <td className="px-4 py-4">{STATUS_LABELS[p.status] ?? p.status}</td>
              <td className="px-4 py-4">{p.total_itens}</td>
              <td className="px-4 py-4 font-semibold">{BRL.format(p.total)}</td>
              <td className="px-4 py-4">
                <Link href={`/checkout/resultado/${p.id}`} className="text-blue-600 hover:underline">
                  Ver
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
