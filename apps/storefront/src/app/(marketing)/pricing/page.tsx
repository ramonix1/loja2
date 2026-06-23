import { marketing as testIds } from '@lojao/test-utils/test-ids/marketing';
import Link from 'next/link';

import { FadeUp } from '@/components/marketing/fade-up';
import { FaqAccordion, type FaqItem } from '@/components/marketing/faq-accordion';
import { PricingSection } from '@/components/marketing/pricing-section';
import { SectionEyebrow } from '@/components/marketing/section-eyebrow';
import {
  MARKETING_PLANS,
  PLAN_COMMON_FEATURES,
  PLAN_COMPARISON_ROWS,
} from '@/lib/marketing/plans';

const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'contato@atalabs.com.br';

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Existe período de teste gratuito?',
    answer:
      'Não oferecemos trial com cartão, mas você pode explorar livremente a loja demo em atalabs.com.br/store/demo antes de contratar. A demo tem produtos e fluxo completo de compra.',
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer:
      'Sim. Não há fidelidade nem multa por cancelamento. Ao cancelar, seus dados ficam disponíveis por 30 dias para exportação.',
  },
  {
    question: 'Como funciona o upgrade de plano?',
    answer:
      'Você pode fazer upgrade ou downgrade a qualquer momento pelo painel. O valor é proporcional ao período restante da assinatura atual — sem cobranças duplas.',
  },
  {
    question: 'Como funciona o desconto anual?',
    answer:
      'Ao optar pelo plano anual, você paga 12 meses com 15% de desconto sobre o valor mensal, em um único boleto ou cartão. O valor exibido é o total do período.',
  },
  {
    question: 'O preço já inclui os gateways de pagamento?',
    answer:
      'Sim, a integração com Stripe, SumUp e Asaas está inclusa no plano. Os gateways cobram suas próprias taxas por transação, separadas da assinatura Ata Commerce.',
  },
  {
    question: 'Posso ter domínio próprio?',
    answer:
      'Sua loja já fica disponível em atalabs.com.br/store/seu-slug sem custo extra. Domínio próprio é um add-on disponível no plano Profissional ou incluso no Empresarial.',
  },
];

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return <span className="font-semibold text-azul-vivido">✓</span>;
  }
  if (value === false) {
    return <span className="text-cinza-pedra/50">—</span>;
  }
  return <span className="text-cinza-pedra">{value}</span>;
}

export default function PlanosPage() {
  return (
    <main data-testid={testIds.pricingPage}>
      {/* ═══════════ HERO ═══════════ */}
      <section
        className="relative overflow-hidden pt-32 pb-20 text-center"
        style={{
          background: 'linear-gradient(160deg, #000d2a 0%, #012a7e 50%, #0d5fe0 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #5cb1fe 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
        <div className="relative z-10 mx-auto max-w-3xl px-6">
          <SectionEyebrow>Ata Commerce</SectionEyebrow>
          <h1 className="mt-4 text-5xl font-extrabold text-white md:text-6xl">
            Planos simples,<br />sem surpresa.
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg text-white/60">
            Sem taxa de setup, sem contrato mínimo. Escolha o plano certo e comece a vender hoje.
          </p>
        </div>
      </section>

      {/* ═══════════ TOGGLE + GRID ═══════════ */}
      <section className="bg-azul-nevoa py-20">
        <div className="mx-auto max-w-6xl px-6">
          <PricingSection plans={MARKETING_PLANS} />
        </div>
      </section>

      {/* ═══════════ INCLUSO EM TODOS ═══════════ */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-6">
          <FadeUp className="mb-10 text-center">
            <SectionEyebrow>Em todos os planos</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-extrabold text-azul-noite">
              O essencial já está incluído.
            </h2>
          </FadeUp>
          <FadeUp>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {PLAN_COMMON_FEATURES.map((feat) => (
                <div
                  key={feat}
                  className="flex items-start gap-3 rounded-xl border border-azul-gelo bg-azul-nevoa p-4"
                >
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-azul-vivido"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-azul-noite">{feat}</span>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ═══════════ TABELA COMPARATIVA ═══════════ */}
      <section className="bg-azul-nevoa py-20">
        <div className="mx-auto max-w-5xl px-6">
          <FadeUp className="mb-10 text-center">
            <SectionEyebrow>Comparativo</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-extrabold text-azul-noite">
              Detalhes de cada plano
            </h2>
          </FadeUp>

          <FadeUp>
            <div
              data-testid={testIds.pricingComparisonTable}
              className="overflow-x-auto rounded-2xl border border-azul-gelo"
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-azul-gelo bg-white">
                    <th className="px-6 py-4 text-left font-semibold text-azul-noite">Recurso</th>
                    {MARKETING_PLANS.map((plan) => (
                      <th
                        key={plan.slug}
                        className={`px-6 py-4 text-center font-semibold ${
                          plan.highlighted ? 'text-azul-comercio' : 'text-azul-noite'
                        }`}
                      >
                        {plan.name}
                        {plan.highlighted && (
                          <span className="ml-1.5 rounded-full bg-azul-vivido px-2 py-0.5 text-[9px] text-white">
                            Popular
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-azul-gelo/50 bg-white">
                  {PLAN_COMPARISON_ROWS.map((row) => (
                    <tr key={row.label} className="hover:bg-azul-nevoa/50">
                      <td className="px-6 py-4 text-azul-noite">{row.label}</td>
                      <td className="px-6 py-4 text-center">
                        <CellValue value={row.starter} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CellValue value={row.professional} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CellValue value={row.enterprise} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-6">
          <FadeUp className="mb-10 text-center">
            <SectionEyebrow>Dúvidas</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-extrabold text-azul-noite">
              Perguntas frequentes sobre planos
            </h2>
          </FadeUp>
          <FadeUp>
            <div className="rounded-2xl border border-azul-gelo bg-azul-nevoa p-8">
              <FaqAccordion items={FAQ_ITEMS} accentColor="#2e8ffb" />
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ═══════════ CTA FINAL ═══════════ */}
      <FadeUp>
        <section className="py-20" style={{ background: '#012a7e' }}>
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="mb-4 text-4xl font-extrabold text-white">
              Ainda tem dúvidas?
            </h2>
            <p className="mb-10 text-lg text-white/60">
              Nossa equipe responde em até 24 horas. Fale com a gente antes de decidir.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/#contato"
                className="inline-flex items-center gap-2 rounded-full bg-azul-vivido px-8 py-4 font-semibold text-white shadow-lg transition-colors hover:bg-azul-ceu"
              >
                Falar com a equipe
              </Link>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-8 py-4 font-semibold text-white transition-colors hover:bg-white/10"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
            <p className="mt-8 text-sm text-white/30">
              Ou explore a{' '}
              <Link href="/demo" className="underline underline-offset-2 hover:text-white/60">
                loja demo
              </Link>{' '}
              antes de decidir.
            </p>
          </div>
        </section>
      </FadeUp>
    </main>
  );
}
