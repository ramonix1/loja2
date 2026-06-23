import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { MARKETING_PLANS } from '@/lib/marketing/plans';
import type { SignupPlanSlug } from '@/lib/signup';

import { CheckoutClient } from './checkout-client';

export const metadata: Metadata = { title: 'Cadastro' };

function resolvePlanSlug(slug?: string): SignupPlanSlug {
  const found = MARKETING_PLANS.find((p) => p.slug === slug);
  return (found?.slug as SignupPlanSlug | undefined) ?? 'professional';
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const planSlug = resolvePlanSlug(plan);

  // Enterprise não tem auto-provisionamento: volta para a tela de proposta.
  if (planSlug === 'enterprise') {
    redirect('/signup?plan=enterprise');
  }

  return <CheckoutClient planSlug={planSlug} />;
}
