'use client';

import { store as testIds } from '@lojao/test-utils/test-ids/store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BRL, legacyAssetUrl } from '@/lib/api';
import { fetchCart, removeCartItem, updateCartItem, type CartItem } from '@/lib/client-api';
import {
  storeBodyClass,
  storeEmptyStateClass,
  storeErrorTextClass,
  storeHeadingClass,
  storeMutedClass,
  storePanelClass,
  storeSubtleClass,
  storeTableHeadClass,
  storeTableRowClass,
  storeTableWrapClass,
} from '@/lib/store-styles';
import { useStoreHref, useStoreLoginHref } from '@/lib/use-store-href';

export function CartView() {
  const router = useRouter();
  const homeHref = useStoreHref('/');
  const checkoutHref = useStoreHref('/checkout');
  const loginHref = useStoreLoginHref('/carrinho');
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
      .catch(() => router.push(loginHref))
      .finally(() => setLoading(false));
  }, [router, loginHref]);

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
    return <p className={storeMutedClass('text-center')}>Carregando carrinho…</p>;
  }

  if (itens.length === 0) {
    return (
      <div className={storeEmptyStateClass()}>
        <p className={storeMutedClass()}>Seu carrinho está vazio.</p>
        <Link href={homeHref} className="btn-primary mt-4 inline-block">
          Continuar comprando
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div data-testid={testIds.cartTable} className={storeTableWrapClass()}>
          <table className="w-full text-left text-sm">
            <thead className={storeTableHeadClass('border-b')}>
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
                  className={storeTableRowClass()}
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
                        <p className={storeBodyClass('font-semibold')}>{item.nome}</p>
                        {item.subtitulo ? (
                          <p className={storeSubtleClass('text-xs')}>{item.subtitulo}</p>
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
                    <button type="button" className={storeErrorTextClass('text-sm hover:underline')} onClick={() => remove(item)}>
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <aside className={storePanelClass('h-fit')}>
        <h2 className={storeHeadingClass('mb-4')}>Resumo</h2>
        <p className={storeMutedClass('flex justify-between text-sm')}>
          <span>Subtotal</span>
          <span className={storeBodyClass('font-semibold')}>{BRL.format(total)}</span>
        </p>
        <p className={storeSubtleClass('mt-2 text-xs')}>Frete calculado no checkout.</p>
        <Link
          href={checkoutHref}
          data-testid={testIds.cartCheckoutBtn}
          className="btn-primary mt-6 block w-full py-3 text-center"
        >
          Ir para checkout
        </Link>
      </aside>
    </div>
  );
}
