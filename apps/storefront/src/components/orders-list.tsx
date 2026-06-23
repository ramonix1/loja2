'use client';

import { buildStorePath } from '@lojao/tenant-host';
import { store as testIds } from '@lojao/test-utils/test-ids/store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BRL } from '@/lib/api';
import { fetchOrders, type BuyerOrder } from '@/lib/client-api';
import {
  storeEmptyStateClass,
  storeLinkClass,
  storeMutedClass,
  storeTableHeadClass,
  storeTableRowClass,
  storeTableWrapClass,
} from '@/lib/store-styles';
import { useStoreSlug } from '@/lib/store-slug-context';
import { useStoreHref, useStoreLoginHref } from '@/lib/use-store-href';

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
  const slug = useStoreSlug();
  const homeHref = useStoreHref('/');
  const loginHref = useStoreLoginHref('/meus-pedidos');
  const [pedidos, setPedidos] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders()
      .then(setPedidos)
      .catch(() => router.push(loginHref))
      .finally(() => setLoading(false));
  }, [router, loginHref]);

  if (loading) return <p className={storeMutedClass('text-center')}>Carregando pedidos…</p>;

  if (pedidos.length === 0) {
    return (
      <div className={storeEmptyStateClass()}>
        <p className={storeMutedClass()}>Você ainda não fez nenhum pedido.</p>
        <Link href={homeHref} className="btn-primary mt-4 inline-block">
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div data-testid={testIds.ordersTable} className={storeTableWrapClass()}>
      <table className="w-full text-left text-sm">
        <thead className={storeTableHeadClass('border-b')}>
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
            <tr key={p.id} data-testid={testIds.orderRow(p.id)} className={storeTableRowClass()}>
              <td className="px-4 py-4 font-semibold">#{p.id}</td>
              <td className="px-4 py-4">{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
              <td className="px-4 py-4">{STATUS_LABELS[p.status] ?? p.status}</td>
              <td className="px-4 py-4">{p.total_itens}</td>
              <td className="px-4 py-4 font-semibold">{BRL.format(p.total)}</td>
              <td className="px-4 py-4">
                <Link
                  href={buildStorePath(slug, `/checkout/resultado/${p.id}`)}
                  className={storeLinkClass()}
                >
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
