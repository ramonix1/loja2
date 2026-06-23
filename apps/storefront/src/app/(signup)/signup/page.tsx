import { signup as testIds } from '@lojao/test-utils/test-ids/signup';
import type { Metadata } from 'next';
import Link from 'next/link';

import { MARKETING_PLANS, formatPlanPrice } from '@/lib/marketing/plans';

export const metadata: Metadata = { title: 'Escolha seu plano' };

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'contato@atalabs.com.br';

function resolvePlan(slug?: string) {
  return MARKETING_PLANS.find((p) => p.slug === slug) ?? MARKETING_PLANS[1]!;
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan: planParam } = await searchParams;
  const plan = resolvePlan(planParam);
  const isEnterprise = plan.slug === 'enterprise';

  return (
    <main data-testid={testIds.page} className="py-16">
      <div className="mx-auto max-w-2xl px-6">
        <div className="mb-8 text-center">
          <span className="inline-block rounded-full bg-azul-gelo/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-azul-comercio">
            Comece em minutos
          </span>
          <h1 className="mt-4 text-4xl font-extrabold text-azul-noite">
            {isEnterprise ? 'Vamos montar seu plano sob medida' : 'Você escolheu o plano ' + plan.name}
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-cinza-pedra">
            {isEnterprise
              ? 'O plano Enterprise é personalizado de acordo com o tamanho da sua operação. Fale com o nosso time para uma proposta.'
              : '14 dias de trial gratuito, sem cartão de crédito. Cancele quando quiser.'}
          </p>
        </div>

        <div className="rounded-2xl border border-azul-gelo bg-white p-8 shadow-sm">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-extrabold text-azul-noite">{plan.name}</h2>
            <div className="text-right">
              {plan.priceMonthly == null ? (
                <span className="text-2xl font-extrabold text-azul-comercio">
                  {plan.priceLabel ?? 'Sob consulta'}
                </span>
              ) : (
                <>
                  <span className="text-3xl font-extrabold text-azul-comercio">
                    {formatPlanPrice(plan.priceMonthly)}
                  </span>
                  <span className="text-sm text-cinza-pedra">/mês</span>
                </>
              )}
            </div>
          </div>
          <p className="mt-2 text-sm text-cinza-pedra">{plan.audience}</p>

          <ul className="mt-6 space-y-3 border-t border-azul-gelo pt-6 text-sm">
            {plan.features.map((feat) => (
              <li key={feat} className="flex items-start gap-3 text-azul-noite">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-azul-comercio"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{feat}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            {isEnterprise ? (
              <a
                data-testid={testIds.continue}
                href={`mailto:${CONTACT_EMAIL}?subject=Proposta Enterprise — Ata Commerce`}
                className="block w-full rounded-xl bg-gradient-to-r from-azul-comercio to-azul-vivido py-4 text-center text-sm font-extrabold text-white transition-all hover:shadow-lg"
              >
                Solicitar proposta
              </a>
            ) : (
              <Link
                data-testid={testIds.continue}
                href={`/signup/checkout?plan=${plan.slug}`}
                className="block w-full rounded-xl bg-gradient-to-r from-azul-comercio to-azul-vivido py-4 text-center text-sm font-extrabold text-white transition-all hover:shadow-lg"
              >
                Continuar para o cadastro
              </Link>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-cinza-pedra">
            Ao continuar você concorda com os termos de serviço da Ata Labs.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-cinza-pedra">
          Quer comparar antes?{' '}
          <Link href="/pricing" className="font-semibold text-azul-comercio underline underline-offset-2">
            Ver todos os planos
          </Link>
        </p>
      </div>
    </main>
  );
}
