'use client';

import { marketing as testIds } from '@lojao/test-utils/test-ids/marketing';
import { useState } from 'react';

import { PricingCard } from '@/components/marketing/pricing-card';
import type { MarketingPlan } from '@/lib/marketing/plans';

interface PricingSectionProps {
  plans: MarketingPlan[];
  /** Override do destino do CTA por plano. Padrão: fluxo self-service (M7). */
  ctaHrefForPlan?: (plan: MarketingPlan) => string;
}

/** CTA padrão self-service: cards → checkout; Enterprise → proposta. */
function defaultCtaHref(plan: MarketingPlan): string {
  return plan.slug === 'enterprise'
    ? '/signup?plan=enterprise'
    : `/signup/checkout?plan=${plan.slug}`;
}

export function PricingSection({ plans, ctaHrefForPlan = defaultCtaHref }: PricingSectionProps) {
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div>
      {/* Toggle mensal / anual */}
      <div className="mb-12 flex items-center justify-center gap-4">
        <span
          className={`text-sm font-medium transition-colors ${
            period === 'monthly' ? 'text-azul-noite' : 'text-cinza-pedra'
          }`}
        >
          Mensal
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={period === 'annual'}
          onClick={() => setPeriod((p) => (p === 'monthly' ? 'annual' : 'monthly'))}
          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-azul-vivido ${
            period === 'annual' ? 'bg-azul-vivido' : 'bg-cinza-areia'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              period === 'annual' ? 'translate-x-8' : 'translate-x-1'
            }`}
          />
        </button>
        <span
          className={`text-sm font-medium transition-colors ${
            period === 'annual' ? 'text-azul-noite' : 'text-cinza-pedra'
          }`}
        >
          Anual
          <span className="ml-1.5 rounded-full bg-azul-vivido px-2 py-0.5 text-[10px] font-semibold text-white">
            −15%
          </span>
        </span>
      </div>

      {/* Grid de cards */}
      <div
        data-testid={testIds.pricingGrid}
        className="grid gap-6 md:grid-cols-3"
      >
        {plans.map((plan) => (
          <PricingCard
            key={plan.slug}
            plan={plan}
            billingPeriod={period}
            theme="blue"
            testId={testIds.pricingCard(plan.slug)}
            ctaHref={ctaHrefForPlan(plan)}
            ctaLabel={plan.cta}
          />
        ))}
      </div>
    </div>
  );
}
