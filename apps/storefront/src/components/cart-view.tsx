'use client';

import { store as testIds } from '@lojao/test-utils/test-ids/store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BRL, legacyAssetUrl } from '@/lib/api';
import { fetchCart, removeCartItem, updateCartItem, type CartItem } from '@/lib/client-api';

export function CartView() {
  const router = useRouter();
  const [itens, setItens] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  async function reload() {
    const data = await fetchCart();
    setItens(data.itens);
    setTotal(data.total);
  }

  useEffect(() => {
    reload()
      .catch(() => router.push('/login?redirect=/carrinho'))
      .finally(() => setLoading(false));
  }, [router]);

  async function changeQty(item: CartItem, qty: number) {
    if (qty < 1) return;
    await updateCartItem(item.id, qty);
    await reload();
  }

  async function remove(item: CartItem) {
    await removeCartItem(item.id);
    await reload();
  }

  if (loading) {
    return <p className="text-center text-gray-500">Carregando carrinho…</p>;
  }

  if (itens.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
        <p className="text-gray-600">Seu carrinho está vazio.</p>
        <Link href="/" className="btn-primary mt-4 inline-block">
          Continuar comprando
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div data-testid={testIds.cartTable} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Qtd</th>
                <th className="px-4 py-3">Subtotal</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr
                  key={item.id}
                  data-testid={testIds.cartItemRow(item.id)}
                  className="border-b last:border-0"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {item.imagem ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={legacyAssetUrl(item.imagem)}
                          alt=""
                          className="h-14 w-14 rounded-lg object-cover"
                        />
                      ) : null}
                      <div>
                        <p className="font-semibold text-gray-900">{item.nome}</p>
                        {item.subtitulo ? (
                          <p className="text-xs text-gray-500">{item.subtitulo}</p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button type="button" className="btn-outline px-2 py-1" onClick={() => changeQty(item, item.quantidade - 1)}>
                        −
                      </button>
                      <span>{item.quantidade}</span>
                      <button type="button" className="btn-outline px-2 py-1" onClick={() => changeQty(item, item.quantidade + 1)}>
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold">{BRL.format(item.subtotal)}</td>
                  <td className="px-4 py-4">
                    <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => remove(item)}>
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="h-fit rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold">Resumo</h2>
        <p className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span className="font-semibold text-gray-900">{BRL.format(total)}</span>
        </p>
        <p className="mt-2 text-xs text-gray-500">Frete calculado no checkout.</p>
        <Link
          href="/checkout"
          data-testid={testIds.cartCheckoutBtn}
          className="btn-primary mt-6 block w-full py-3 text-center"
        >
          Ir para checkout
        </Link>
      </aside>
    </div>
  );
}
