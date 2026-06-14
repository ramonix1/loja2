import { OrdersList } from '@/components/orders-list';

export const dynamic = 'force-dynamic';

export default function OrdersPage() {
  return (
    <div>
      <h1 className="mb-8 text-3xl font-extrabold text-gray-900">Meus pedidos</h1>
      <OrdersList />
    </div>
  );
}
