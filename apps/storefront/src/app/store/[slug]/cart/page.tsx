import { CartView } from '@/components/cart-view';
import { storePageTitleClass } from '@/lib/store-styles';

export const dynamic = 'force-dynamic';

export default function CartPage() {
  return (
    <div>
      <h1 className={storePageTitleClass('mb-8')}>Carrinho</h1>
      <CartView />
    </div>
  );
}
