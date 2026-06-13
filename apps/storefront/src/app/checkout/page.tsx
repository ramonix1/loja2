import { CheckoutForm } from '@/components/checkout-form';

export const dynamic = 'force-dynamic';

export default function CheckoutPage() {
  return (
    <div>
      <h1 className="mb-8 text-3xl font-extrabold text-gray-900">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
