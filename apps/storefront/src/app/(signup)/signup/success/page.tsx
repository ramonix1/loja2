import { buildStorePath } from '@lojao/tenant-host';
import { signup as testIds } from '@lojao/test-utils/test-ids/signup';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { MARKETING_PLANS } from '@/lib/marketing/plans';

import { Confetti } from './confetti';

export const metadata: Metadata = { title: 'Loja criada com sucesso' };

const ADMIN_URL = (process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://app.atalabs.com.br').replace(/\/$/, '');

function planName(slug?: string): string {
  return MARKETING_PLANS.find((p) => p.slug === slug)?.name ?? 'Ata Commerce';
}

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

const TIMELINE = [
  {
    title: 'Acesse seu painel',
    body: 'Entre com o e-mail e a senha que você acabou de cadastrar. Sem precisar decorar endereço da loja.',
  },
  {
    title: 'Personalize sua loja',
    body: 'Adicione produtos, configure pagamentos e ajuste a identidade visual. Você tem 14 dias para explorar sem pagar.',
  },
  {
    title: 'Compartilhe e venda',
    body: 'Divulgue o link da sua loja nas redes sociais e comece a receber pedidos de qualquer lugar.',
  },
];

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; plan?: string; trial?: string }>;
}) {
  const { slug, plan, trial } = await searchParams;
  if (!slug) redirect('/signup');

  const storePath = buildStorePath(slug);
  const adminLoginUrl = `${ADMIN_URL}/login`;
  const trialDate = formatDate(trial);

  return (
    <main data-testid={testIds.successPage} className="bg-white">
      <Confetti />

      {/* HERO */}
      <section className="px-6 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex justify-center">
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-full border-4 border-azul-comercio bg-azul-nevoa">
              <svg className="h-12 w-12 text-azul-comercio" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight text-azul-noite md:text-5xl">
            Sua loja está no ar! 🎉
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-cinza-pedra">
            Parabéns! Sua loja <strong className="text-azul-noite">{slug}</strong> no plano{' '}
            <strong className="text-azul-noite">{planName(plan)}</strong> foi criada com sucesso.
          </p>

          {/* RESUMO */}
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-azul-gelo bg-azul-nevoa p-6 text-left">
            <div className="flex justify-between border-b border-azul-gelo py-2">
              <span className="text-cinza-pedra">Endereço da loja</span>
              <span className="font-semibold text-azul-noite">atalabs.com.br/store/{slug}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-cinza-pedra">Período de trial</span>
              <span className="font-semibold text-azul-comercio">
                {trialDate ? `até ${trialDate}` : '14 dias grátis'}
              </span>
            </div>
          </div>

          {/* CTAs */}
          <div className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row">
            <a
              data-testid={testIds.successAdminLink}
              href={adminLoginUrl}
              className="flex-1 rounded-xl bg-gradient-to-r from-azul-comercio to-azul-vivido px-6 py-4 text-center text-sm font-extrabold text-white transition-all hover:shadow-lg"
            >
              Ir para o painel
            </a>
            <Link
              data-testid={testIds.successStoreLink}
              href={storePath}
              className="flex-1 rounded-xl border-2 border-azul-comercio px-6 py-4 text-center text-sm font-extrabold text-azul-comercio transition-colors hover:bg-azul-comercio hover:text-white"
            >
              Ver minha loja
            </Link>
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="bg-azul-nevoa px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-12 text-center text-3xl font-extrabold text-azul-noite">
            Seus próximos passos
          </h2>
          <ol className="space-y-8">
            {TIMELINE.map((item, i) => (
              <li key={item.title} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-azul-comercio text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-extrabold text-azul-noite">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-cinza-pedra">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-12 text-center text-sm text-cinza-pedra">
            Enviamos um e-mail de boas-vindas com os detalhes do seu acesso.
          </p>
        </div>
      </section>
    </main>
  );
}
