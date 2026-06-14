import { CartView } from '@/components/cart-view';

export const dynamic = 'force-dynamic';

export default function CartPage() {
  return (
    <div>
      <h1 className="mb-8 text-3xl font-extrabold text-gray-900">Carrinho</h1>
      <CartView />
    </div>
  );
}
