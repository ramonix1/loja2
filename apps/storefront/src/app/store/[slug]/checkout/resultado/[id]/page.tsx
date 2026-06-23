import { CheckoutResultView } from '@/components/checkout-result-view';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CheckoutResultPage({ params }: PageProps) {
  const { id } = await params;
  const pedidoId = Number(id);

  return (
    <div>
      <CheckoutResultView pedidoId={pedidoId} />
    </div>
  );
}
