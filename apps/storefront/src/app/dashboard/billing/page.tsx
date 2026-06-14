import { BillingDashboard } from '@/components/billing-dashboard';

export const dynamic = 'force-dynamic';

export default function BillingPage() {
  return (
    <div>
      <h1 className="mb-8 text-3xl font-extrabold text-gray-900">Faturamento da loja</h1>
      <BillingDashboard />
    </div>
  );
}
