import { CheckoutForm } from '@/components/checkout-form';
import { storePageTitleClass } from '@/lib/store-styles';

export const dynamic = 'force-dynamic';

export default function CheckoutPage() {
  return (
    <div>
      <h1 className={storePageTitleClass('mb-8')}>Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
