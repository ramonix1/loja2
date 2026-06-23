import { BillingDashboard } from '@/components/billing-dashboard';
import { storePageTitleClass } from '@/lib/store-styles';

export const dynamic = 'force-dynamic';

export default function BillingPage() {
  return (
    <div>
      <h1 className={storePageTitleClass('mb-8')}>Faturamento da loja</h1>
      <BillingDashboard />
    </div>
  );
}
