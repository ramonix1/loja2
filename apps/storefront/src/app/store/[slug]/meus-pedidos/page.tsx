import { OrdersList } from '@/components/orders-list';
import { storePageTitleClass } from '@/lib/store-styles';

export const dynamic = 'force-dynamic';

export default function OrdersPage() {
  return (
    <div>
      <h1 className={storePageTitleClass('mb-8')}>Meus pedidos</h1>
      <OrdersList />
    </div>
  );
}
