import { marketing as testIds } from '@lojao/test-utils/test-ids/marketing';
import Image from 'next/image';
import Link from 'next/link';

import { BrowserFrame } from '@/components/marketing/browser-frame';
import { FadeUp } from '@/components/marketing/fade-up';
import { FaqAccordion, type FaqItem } from '@/components/marketing/faq-accordion';
import { SectionEyebrow } from '@/components/marketing/section-eyebrow';

// ─── Dados ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />,
    title: 'Loja Virtual Completa',
    description: 'Produtos, categorias, estoque e preços gerenciados com interface intuitiva.',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
    title: 'Pagamentos Integrados',
    description: 'Cartão, boleto e Pix. Stripe, SumUp e Asaas prontos desde o primeiro dia.',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
    title: 'Gestão de Pedidos',
    description: 'Acompanhe pedidos em tempo real e mantenha clientes informados em cada etapa.',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    title: 'Relatórios de Vendas',
    description: 'Dashboards com produtos mais vendidos, faturamento e comportamento de clientes.',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
    title: 'Multi-lojas',
    description: 'Gerencie múltiplas lojas em uma plataforma. Ideal para redes e franquias.',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />,
    title: 'Frete e Logística',
    description: 'Cálculo automático de frete com regiões configuráveis e múltiplas opções.',
  },
] as const;

const STEPS = [
  {
    number: '01',
    title: 'Criar sua loja',
    description:
      'Cadastre-se, escolha seu slug e configure as informações básicas da sua loja em minutos.',
  },
  {
    number: '02',
    title: 'Personalizar',
    description:
      'Adicione seus produtos, defina categorias, envie seu logo e ajuste as cores da vitrine.',
  },
  {
    number: '03',
    title: 'Começar a vender',
    description:
      'Compartilhe o link da sua loja e receba pedidos com Pix, cartão ou boleto — sem taxa de setup.',
  },
] as const;

const INTEGRACOES = [
  { name: 'Stripe', tag: 'Cartão / Pix' },
  { name: 'SumUp', tag: 'Maquininha + Digital' },
  { name: 'Asaas', tag: 'Pix / Boleto / Cartão' },
  { name: 'Melhor Envio', tag: 'Frete nacional' },
  { name: 'Chat integrado', tag: 'Suporte ao comprador' },
  { name: 'WhatsApp', tag: 'Notificações (em breve)' },
] as const;

const BROWSER_FRAMES = [
  {
    url: 'app.atalabs.com.br/admin/dashboard',
    title: 'Painel Administrativo',
    subtitle: 'Métricas e pedidos em tempo real',
    placeholder: 'Painel — em breve',
  },
  {
    url: 'atalabs.com.br/store/demo',
    title: 'Vitrine do Cliente',
    subtitle: 'Responsiva e pronta para vender',
    placeholder: 'Vitrine — em breve',
  },
] as const;

const COMPARATIVO = [
  { recurso: 'Configurar sem código', sem: false, com: true },
  { recurso: 'Pagamentos BR nativos', sem: false, com: true },
  { recurso: 'Gestão de pedidos', sem: false, com: true },
  { recurso: 'Multi-lojas', sem: false, com: true },
  { recurso: 'Relatórios de vendas', sem: false, com: true },
  { recurso: 'Custo de setup', sem: 'Alto', com: 'R$ 0' },
] as const;

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Quanto custa para começar?',
    answer:
      'O setup é gratuito. Você paga apenas a mensalidade do plano escolhido, sem taxas ocultas. Confira os valores completos na página de Planos.',
  },
  {
    question: 'Preciso ter domínio próprio?',
    answer:
      'Não é obrigatório. Sua loja estará disponível em atalabs.com.br/store/seu-slug imediatamente. Domínio próprio está disponível como add-on nos planos superiores.',
  },
  {
    question: 'Como funciona o suporte?',
    answer:
      'Oferecemos suporte por e-mail para todos os planos. Nosso time responde em até 24 horas úteis. Planos superiores terão canais prioritários em breve.',
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer:
      'Sim. Não há fidelidade. Você pode cancelar a assinatura quando quiser. Seus dados ficam disponíveis por 30 dias após o cancelamento.',
  },
  {
    question: 'Quais gateways de pagamento são suportados?',
    answer:
      'Atualmente integramos Stripe, SumUp e Asaas, cobrindo cartão de crédito/débito, Pix e boleto bancário. Novos gateways são adicionados conforme demanda.',
  },
  {
    question: 'É possível migrar produtos de outra plataforma?',
    answer:
      'Estamos desenvolvendo ferramentas de importação (CSV e APIs de parceiros). Enquanto isso, nossa equipe pode auxiliar na migração manual para planos profissionais.',
  },
];

// ─── Página ───────────────────────────────────────────────────────────────────

export default function AtaCommercePage() {
  return (
    <main>
      {/* ═══════════ HERO ═══════════ */}
      <section
        data-testid={testIds.ataCommerceHero}
        className="relative flex min-h-screen items-center overflow-hidden pt-20"
        style={{ background: 'var(--ata-commerce-hero-gradient)' }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #2E8FFB 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 md:grid md:grid-cols-2 md:gap-12 md:py-32">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <Image
                src="/marketing/ata-fruit-blue.png"
                alt="Ata Commerce"
                width={28}
                height={28}
                className="h-7 w-auto opacity-90"
              />
              <div>
                <p className="text-lg font-extrabold leading-none text-white/90">
                  Ata<span className="font-normal text-white/50">Commerce</span>
                  <span className="text-azul-vivido">·</span>
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-white/30">by Ata Labs</p>
              </div>
            </div>

            <h1 className="mb-6 text-4xl font-medium leading-[1.05] text-white md:text-6xl lg:text-7xl">
              Sua loja online,
              <br />
              <span className="font-bold text-azul-vivido">pronta</span> para
              <br />
              vender.
            </h1>

            <p className="mb-10 max-w-md text-lg font-light leading-relaxed text-white/55 md:text-xl">
              Plataforma <strong className="font-semibold text-white">whitelabel e multi-tenant</strong>{' '}
              de e-commerce para o mercado brasileiro. Sua marca, seu domínio — nossa infraestrutura.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full bg-azul-comercio px-7 py-4 font-semibold text-white shadow-lg transition-all hover:opacity-90 hover:shadow-xl"
              >
                Ver planos e preços
              </Link>
              <Link
                href="#o-produto"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-4 font-semibold text-white transition-colors hover:bg-white/10"
              >
                Entender o produto
              </Link>
            </div>
          </div>

          <div className="mt-16 flex items-center justify-center md:mt-0">
            <Image
              src="/marketing/ata-fruit-blue.png"
              alt="Ata Commerce"
              width={384}
              height={384}
              className="float-anim h-auto w-72 drop-shadow-2xl md:w-96"
              priority
            />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-6 border-y border-azul-gelo py-10 md:grid-cols-4">
            {[
              { value: 'R$ 0', label: 'Taxa de setup' },
              { value: '15 min', label: 'Para ativar sua loja' },
              { value: '3', label: 'Gateways integrados' },
              { value: '100%', label: 'Suporte em português' },
            ].map((stat) => (
              <FadeUp key={stat.label} className="text-center">
                <p className="text-4xl font-extrabold text-azul-comercio">{stat.value}</p>
                <p className="mt-1 text-sm text-cinza-pedra">{stat.label}</p>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEMA / SOLUÇÃO */}
      <section id="o-produto" className="bg-azul-nevoa py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeUp className="mb-16 text-center">
            <SectionEyebrow>Por que Ata Commerce?</SectionEyebrow>
            <h2 className="mt-4 text-4xl font-extrabold text-azul-noite md:text-5xl">
              Vender online não precisa ser complicado.
            </h2>
          </FadeUp>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                ),
                title: 'Sem código',
                description:
                  'Configure tudo pelo painel admin: produtos, aparência, pagamentos e frete — sem tocar em uma linha de código.',
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                ),
                title: 'Pagamentos BR nativos',
                description:
                  'Pix, boleto e cartão com Stripe, SumUp e Asaas — os gateways que os brasileiros já usam.',
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                ),
                title: 'Multi-loja',
                description:
                  'Uma conta, múltiplas lojas. Perfeito para quem tem redes, representações ou marcas diferentes.',
              },
            ].map((item) => (
              <FadeUp key={item.title}>
                <div className="rounded-2xl border border-azul-gelo bg-white p-8">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-azul-nevoa">
                    <svg className="h-6 w-6" fill="none" stroke="#0d5fe0" strokeWidth="1.5" viewBox="0 0 24 24">
                      {item.icon}
                    </svg>
                  </div>
                  <h3 className="mb-3 text-lg font-extrabold text-azul-noite">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-cinza-pedra">{item.description}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES GRID ═══════════ */}
      <section className="bg-white py-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeUp className="mb-16 text-center">
            <SectionEyebrow>Funcionalidades</SectionEyebrow>
            <h2 className="mt-4 text-4xl font-extrabold text-azul-noite md:text-5xl">
              Tudo que você precisa para vender online.
            </h2>
          </FadeUp>

          <div
            data-testid={testIds.ataCommerceFeatures}
            className="grid gap-5 md:grid-cols-3"
          >
            {FEATURES.map((f) => (
              <FadeUp key={f.title}>
                <div className="card-hover rounded-2xl border border-azul-gelo bg-azul-nevoa p-8 transition-colors hover:border-azul-vivido">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
                    <svg className="h-6 w-6" fill="none" stroke="#0d5fe0" strokeWidth="1.5" viewBox="0 0 24 24">
                      {f.icon}
                    </svg>
                  </div>
                  <h3 className="mb-3 text-lg font-extrabold text-azul-noite">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-cinza-pedra">{f.description}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ COMO FUNCIONA ═══════════ */}
      <section className="py-28" style={{ background: '#012a7e' }}>
        <div className="mx-auto max-w-7xl px-6">
          <FadeUp className="mb-16 text-center">
            <SectionEyebrow>Primeiros passos</SectionEyebrow>
            <h2 className="mt-4 text-4xl font-extrabold text-white md:text-5xl">
              Como funciona
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-white/50">
              Da criação à primeira venda em menos tempo do que você imagina.
            </p>
          </FadeUp>

          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((step) => (
              <FadeUp key={step.number}>
                <div className="relative rounded-2xl border border-white/10 bg-white/5 p-8">
                  <span
                    className="mb-6 block text-5xl font-extrabold"
                    style={{ color: '#2e8ffb', opacity: 0.4 }}
                  >
                    {step.number}
                  </span>
                  <h3 className="mb-3 text-xl font-extrabold text-white">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-white/50">{step.description}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ INTEGRAÇÕES ═══════════ */}
      <section className="bg-azul-nevoa py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeUp className="mb-14 text-center">
            <SectionEyebrow>Ecossistema</SectionEyebrow>
            <h2 className="mt-4 text-4xl font-extrabold text-azul-noite md:text-5xl">
              Integrações que você já conhece.
            </h2>
          </FadeUp>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {INTEGRACOES.map((int) => (
              <FadeUp key={int.name}>
                <div className="rounded-2xl border border-azul-gelo bg-white p-6 text-center">
                  <p className="text-lg font-extrabold text-azul-noite">{int.name}</p>
                  <p className="mt-1 text-xs text-cinza-pedra">{int.tag}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ SCREENSHOTS ═══════════ */}
      <section className="py-28" style={{ background: '#000d2a' }}>
        <div className="mx-auto max-w-7xl px-6">
          <FadeUp className="mb-14 text-center">
            <SectionEyebrow>Interface</SectionEyebrow>
            <h2 className="mt-4 text-4xl font-extrabold text-white md:text-5xl">
              Visual do sistema
            </h2>
            <p className="mx-auto mt-4 max-w-md text-lg text-white/40">
              Painel limpo e vitrine responsiva — prontos para impressionar.
            </p>
          </FadeUp>

          <div className="grid gap-5 md:grid-cols-2">
            {BROWSER_FRAMES.map((frame) => (
              <FadeUp key={frame.url}>
                <BrowserFrame
                  variant="blue"
                  url={frame.url}
                  title={frame.title}
                  subtitle={frame.subtitle}
                  placeholder={frame.placeholder}
                />
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ COMPARATIVO ═══════════ */}
      <section className="bg-white py-28">
        <div className="mx-auto max-w-4xl px-6">
          <FadeUp className="mb-14 text-center">
            <SectionEyebrow>Comparativo</SectionEyebrow>
            <h2 className="mt-4 text-4xl font-extrabold text-azul-noite md:text-5xl">
              Com vs. sem Ata Commerce
            </h2>
          </FadeUp>

          <FadeUp>
            <div className="overflow-hidden rounded-2xl border border-azul-gelo">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-azul-gelo bg-azul-nevoa">
                    <th className="px-6 py-4 text-left font-semibold text-azul-noite">Recurso</th>
                    <th className="px-6 py-4 text-center font-semibold text-cinza-pedra">
                      Planilha / WhatsApp
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-azul-comercio">
                      Ata Commerce
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-azul-gelo/50">
                  {COMPARATIVO.map((row) => (
                    <tr key={row.recurso}>
                      <td className="px-6 py-4 text-verde-conde">{row.recurso}</td>
                      <td className="px-6 py-4 text-center">
                        {row.sem === false ? (
                          <span className="text-red-400">✗</span>
                        ) : (
                          <span className="text-cinza-pedra">{row.sem}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.com === true ? (
                          <span className="font-semibold text-azul-vivido">✓</span>
                        ) : (
                          <span className="font-semibold text-azul-comercio">{row.com}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <FadeUp>
        <section className="py-28" style={{ background: '#0d5fe0' }}>
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="mb-6 text-4xl font-extrabold text-white md:text-5xl">
              Pronto para começar?
            </h2>
            <p className="mb-10 text-xl leading-relaxed text-white/65">
              Escolha um plano e tenha sua loja no ar ainda hoje.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-3 rounded-full bg-white px-10 py-5 text-lg font-extrabold text-azul-comercio shadow-xl transition-all hover:bg-azul-nevoa"
              >
                Ver planos
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-4 font-semibold text-white transition-colors hover:bg-white/10"
              >
                Ver demo
              </Link>
            </div>
          </div>
        </section>
      </FadeUp>

      {/* ═══════════ FAQ ═══════════ */}
      <section
        data-testid={testIds.ataCommerceFaq}
        className="bg-azul-nevoa py-28"
      >
        <div className="mx-auto max-w-3xl px-6">
          <FadeUp className="mb-14 text-center">
            <SectionEyebrow>Dúvidas frequentes</SectionEyebrow>
            <h2 className="mt-4 text-4xl font-extrabold text-azul-noite md:text-5xl">FAQ</h2>
          </FadeUp>
          <FadeUp>
            <div className="rounded-2xl border border-azul-gelo bg-white p-8">
              <FaqAccordion items={FAQ_ITEMS} accentColor="#2e8ffb" />
            </div>
          </FadeUp>
        </div>
      </section>
    </main>
  );
}
