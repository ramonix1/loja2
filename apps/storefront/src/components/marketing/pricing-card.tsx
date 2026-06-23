'use client';

import Link from 'next/link';

import type { MarketingPlan } from '@/lib/marketing/plans';
import { annualPrice, formatPlanPrice } from '@/lib/marketing/plans';

export type PricingTheme = 'green' | 'blue';

interface PricingCardProps {
  plan: MarketingPlan;
  billingPeriod?: 'monthly' | 'annual';
  ctaHref?: string;
  ctaLabel?: string;
  testId?: string;
  theme?: PricingTheme;
}

export function PricingCard({
  plan,
  billingPeriod = 'monthly',
  ctaHref = '/#contato',
  ctaLabel,
  testId,
  theme = 'blue',
}: PricingCardProps) {
  const resolvedCtaLabel = ctaLabel ?? plan.cta;
  const displayPrice =
    plan.priceMonthly == null
      ? (plan.priceLabel ?? 'Personalizado')
      : billingPeriod === 'annual'
        ? formatPlanPrice(annualPrice(plan.priceMonthly))
        : formatPlanPrice(plan.priceMonthly);
  const periodLabel =
    plan.priceMonthly == null ? '' : billingPeriod === 'annual' ? '/ano' : '/mês';

  let cardClass: string;
  let badgeBg: string;
  let ctaClass: string;
  let textMuted: string;
  let textBase: string;

  if (plan.highlighted) {
    if (theme === 'blue') {
      cardClass = 'plan-card featured border-azul-comercio bg-white text-azul-noite shadow-xl';
      badgeBg = 'bg-azul-comercio';
      ctaClass = 'bg-azul-comercio text-white hover:bg-azul-noite';
      textMuted = 'text-cinza-pedra';
      textBase = 'text-azul-noite';
    } else {
      cardClass = 'border-verde-broto bg-verde-conde text-white shadow-xl';
      badgeBg = 'bg-verde-broto';
      ctaClass = 'bg-verde-broto text-white hover:bg-verde-mata';
      textMuted = 'text-white/60';
      textBase = 'text-white';
    }
  } else if (theme === 'blue') {
    cardClass = 'plan-card border-azul-gelo bg-white text-azul-noite';
    badgeBg = 'bg-azul-vivido';
    ctaClass =
      plan.slug === 'enterprise'
        ? 'border-2 border-azul-comercio text-azul-comercio hover:bg-azul-comercio hover:text-white'
        : 'bg-azul-nevoa text-azul-comercio hover:bg-azul-comercio hover:text-white';
    textMuted = 'text-cinza-pedra';
    textBase = 'text-azul-noite';
  } else {
    cardClass = 'border-cinza-areia bg-white text-verde-conde';
    badgeBg = 'bg-verde-broto';
    ctaClass = 'bg-verde-broto text-white hover:bg-verde-mata';
    textMuted = 'text-cinza-pedra';
    textBase = 'text-verde-conde';
  }

  const featureCheckColor = theme === 'blue' ? '#0d5fe0' : '#639922';

  return (
    <article
      data-testid={testId}
      className={`relative flex flex-col rounded-2xl p-10 ${cardClass}`}
    >
      {plan.highlighted && (
        <span
          className={`mb-4 inline-block w-fit rounded-full px-3 py-1 text-xs font-semibold text-white ${badgeBg}`}
        >
          Mais popular
        </span>
      )}

      <h3 className={`text-2xl font-extrabold ${textBase}`}>{plan.name}</h3>
      <p className={`mt-2 text-sm ${textMuted}`}>{plan.audience}</p>

      <div className="mt-6 mb-2 flex items-baseline gap-1">
        <span className={`font-extrabold ${plan.priceMonthly == null ? 'text-3xl' : 'text-4xl'} ${textBase}`}>
          {displayPrice}
        </span>
        {periodLabel ? <span className={`text-sm ${textMuted}`}>{periodLabel}</span> : null}
      </div>
      <p className={`text-xs ${textMuted}`}>
        {plan.priceMonthly == null ? 'Entre em contato para cotação' : 'Cancelável a qualquer momento'}
      </p>

      <Link
        href={ctaHref}
        className={`mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-colors ${ctaClass}`}
      >
        {resolvedCtaLabel}
      </Link>

      <ul className={`mt-8 flex-1 space-y-4 border-t pt-8 text-sm ${textMuted}`}>
        {plan.features.map((feat) => (
          <li key={feat} className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0"
              style={{ color: featureCheckColor }}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className={`font-semibold ${textBase}`}>{feat}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
