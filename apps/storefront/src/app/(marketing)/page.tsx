import { marketing as testIds } from '@lojao/test-utils/test-ids/marketing';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

import { ContactForm } from '@/components/marketing/contact-form';
import { FadeUp } from '@/components/marketing/fade-up';
import { SectionEyebrow } from '@/components/marketing/section-eyebrow';

export const metadata: Metadata = {
  title: 'Ata Labs — Compartilhando Soluções',
  description:
    'Soluções digitais para pequenos e médios negócios. Conheça o Ata Commerce.',
  openGraph: {
    title: 'Ata Labs — Compartilhando Soluções',
    locale: 'pt_BR',
  },
};

const SOLUCOES = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="#639922" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    title: 'E-commerce Whitelabel',
    description:
      'Loja virtual com o seu nome e marca. Configure, personalize e venda — sem escrever uma linha de código.',
    dark: false,
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="#639922" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    title: 'Pagamentos Brasileiros',
    description:
      'Cartão, boleto e Pix. Stripe, SumUp e Asaas integrados e prontos para aceitar pagamentos no primeiro dia.',
    dark: false,
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    title: 'Multi-tenant SaaS',
    description:
      'Plataforma multi-loja escalável. Cada cliente tem seu ambiente isolado com gestão centralizada para você.',
    dark: true,
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="#639922" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Relatórios em Tempo Real',
    description:
      'Dashboards completos: vendas, produtos mais pedidos e comportamento de clientes — tudo acessível de qualquer lugar.',
    dark: false,
  },
] as const;

const ATACOMMERCE_BULLETS = [
  'Loja com sua marca e domínio próprio (whitelabel)',
  'Pix, boleto e cartão integrados desde o primeiro dia',
  'Multi-lojas: cada ambiente isolado, gerenciado no centro',
  'Pronto em 15 minutos, sem taxa de setup',
] as const;

const ATACOMMERCE_FEATURES = [
  { title: 'Loja completa', description: 'Produtos, categorias, estoque' },
  { title: 'Pagamentos BR', description: 'Pix, boleto, cartão' },
  { title: 'Relatórios', description: 'Dashboard em tempo real' },
  { title: 'Multi-lojas', description: 'Gestão centralizada' },
] as const;

const SOBRE_ITENS = [
  {
    title: 'Tecnologia nacional',
    description: 'Desenvolvida por brasileiros, para o mercado brasileiro.',
  },
  {
    title: 'Suporte próximo',
    description: 'Atendimento humanizado, sem filas de chamado intermináveis.',
  },
  {
    title: 'Evolução contínua',
    description: 'Atualizações constantes com base no feedback dos nossos clientes.',
  },
] as const;

export default function LandingPage() {
  return (
    <main>
      {/* HERO */}
      <section
        data-testid={testIds.landingHero}
        className="relative flex min-h-screen items-center overflow-hidden pt-20"
        style={{ background: 'var(--ata-hero-gradient)' }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #96d43a 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 py-24 md:grid-cols-2 md:py-32">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <Image
                src="/marketing/ata-fruit-white.png"
                alt=""
                width={28}
                height={28}
                className="h-7 w-auto opacity-80"
                aria-hidden
              />
              <div>
                <p className="text-lg font-extrabold leading-none text-white/90">
                  Ata<span className="font-normal text-white/50">Labs</span>
                  <span className="text-verde-broto">·</span>
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-white/30">
                  Compartilhando Soluções
                </p>
              </div>
            </div>

            <h1 className="mb-6 text-4xl font-medium leading-[1.05] text-white md:text-6xl lg:text-7xl">
              Seu negócio
              <br />
              <span className="font-bold text-verde-broto">pronto</span> para
              <br />
              vender online.
            </h1>

            <p className="mb-10 max-w-md text-lg font-light leading-relaxed text-white/55 md:text-xl">
              A <strong className="font-semibold text-white">Ata Labs</strong> cria soluções digitais
              para pequenos e médios negócios. Tudo começa pelo{' '}
              <strong className="font-semibold text-verde-broto">Ata Commerce</strong> — vitrine
              whitelabel pronta para vender.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                data-testid={testIds.landingHeroCtaPricing}
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full bg-verde-broto px-7 py-4 font-semibold text-white shadow-lg transition-all hover:opacity-90 hover:shadow-xl"
              >
                Conheça os planos
              </Link>
              <Link
                href="#solucoes"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-4 font-semibold text-white transition-colors hover:bg-white/10"
              >
                Ver soluções
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <Image
              src="/marketing/ata-fruit-cut.png"
              alt="Ata Labs"
              width={384}
              height={384}
              className="float-anim h-auto w-72 drop-shadow-2xl md:w-96"
              priority
            />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section data-testid={testIds.landingStats} className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-6 border-y border-cinza-areia py-10 md:grid-cols-4">
            {[
              { value: '100+', label: 'Lojas ativas' },
              { value: 'R$0', label: 'Taxa de setup' },
              { value: '3', label: 'Gateways integrados' },
              { value: '100%', label: 'Feito no Brasil' },
            ].map((stat) => (
              <FadeUp key={stat.label} className="text-center">
                <p className="text-4xl font-extrabold text-verde-conde">{stat.value}</p>
                <p className="mt-1 text-sm text-cinza-pedra">{stat.label}</p>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUÇÕES */}
      <section id="solucoes" className="bg-creme py-12 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-start gap-20 md:grid-cols-2">
            <div className="md:sticky md:top-32">
              <SectionEyebrow>O que fazemos</SectionEyebrow>
              <h2 className="mt-4 mb-6 text-3xl font-extrabold leading-tight text-verde-conde md:text-5xl">
                Tecnologia que
                <br />
                coloca negócios
                <br />
                no digital.
              </h2>
              <p className="text-lg leading-relaxed text-cinza-pedra">
                A Ata Labs nasceu para simplificar o comércio digital. Ferramentas que qualquer
                empreendedor consegue usar — sem precisar de um time de TI.
              </p>
            </div>

            <div className="space-y-4">
              {SOLUCOES.map((s) => (
                <FadeUp key={s.title}>
                  <div
                    className={`card-hover rounded-2xl border p-7 ${
                      s.dark ? 'border-transparent text-white' : 'border-cinza-areia bg-white'
                    }`}
                    style={s.dark ? { background: '#27500A' } : undefined}
                  >
                    <div
                      className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${
                        s.dark ? 'bg-white/10' : 'bg-creme'
                      }`}
                    >
                      {s.icon}
                    </div>
                    <h3
                      className={`mb-2 text-lg font-extrabold ${
                        s.dark ? 'text-white' : 'text-verde-conde'
                      }`}
                    >
                      {s.title}
                    </h3>
                    <p className={`text-sm leading-relaxed ${s.dark ? 'text-white/65' : 'text-cinza-pedra'}`}>
                      {s.description}
                    </p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ATA COMMERCE TEASER */}
      <section id="atacommerce" className="bg-creme py-12 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-16 md:grid-cols-2">
            <FadeUp>
              <SectionEyebrow>Produto principal</SectionEyebrow>
              <div className="mt-4 mb-6 flex items-center gap-3">
                <Image
                  src="/marketing/ata-fruit-blue.png"
                  alt="Ata Commerce"
                  width={40}
                  height={40}
                  className="h-10 w-auto"
                />
                <h2 className="text-4xl font-extrabold text-azul-noite md:text-5xl">
                  Ata<span className="font-normal text-azul-comercio">Commerce</span>
                  <span className="text-azul-vivido">·</span>
                </h2>
              </div>
              <p className="mb-8 text-lg leading-relaxed text-cinza-pedra">
                Nossa plataforma{' '}
                <strong className="font-semibold text-verde-conde">whitelabel e multi-tenant</strong>{' '}
                de e-commerce para o mercado brasileiro. Sua marca, seu domínio, nossa infraestrutura.
              </p>

              <ul className="mb-10 space-y-3">
                {ATACOMMERCE_BULLETS.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-cinza-areia bg-white">
                      <svg
                        className="h-2.5 w-2.5"
                        fill="none"
                        stroke="#639922"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-verde-conde">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/ata-commerce"
                  className="inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold text-white shadow-lg transition-all hover:opacity-90"
                  style={{ background: '#0D5FE0' }}
                >
                  Conhecer o Ata Commerce
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-full border border-cinza-areia px-7 py-4 font-semibold text-verde-conde transition-colors hover:bg-white"
                >
                  Ver planos
                </Link>
              </div>
            </FadeUp>

            <FadeUp>
              <div className="grid grid-cols-2 gap-4">
                {ATACOMMERCE_FEATURES.map((f) => (
                  <div
                    key={f.title}
                    className="card-hover rounded-2xl border border-cinza-areia bg-white p-6"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-creme">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="#639922"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-extrabold text-verde-conde">{f.title}</h4>
                    <p className="mt-1 text-xs text-cinza-pedra">{f.description}</p>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="bg-white py-12 md:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-20 px-6 md:grid-cols-2">
          <FadeUp>
            <SectionEyebrow>Quem somos</SectionEyebrow>
            <h2 className="mt-4 mb-6 text-3xl font-extrabold leading-tight text-verde-conde md:text-5xl">
              Tecnologia
              <br />
              nacional para
              <br />
              quem vende.
            </h2>
            <p className="mb-6 text-lg leading-relaxed text-cinza-pedra">
              Somos uma empresa brasileira de tecnologia focada em criar soluções digitais que fazem a
              diferença no dia a dia de empreendedores.
            </p>
            <p className="mb-10 leading-relaxed text-cinza-pedra">
              Nossa missão é democratizar o comércio digital, oferecendo ferramentas poderosas e
              acessíveis para empresas de todos os tamanhos crescerem no ambiente online.
            </p>

            <div className="space-y-5">
              {SOBRE_ITENS.map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-verde-broto"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold text-verde-conde">{item.title}</p>
                    <p className="text-sm text-cinza-pedra">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>

          <FadeUp className="flex justify-center">
            <div className="relative w-full max-w-xs">
              <div
                className="rounded-3xl p-12 text-center shadow-2xl"
                style={{ background: 'linear-gradient(145deg, #173404, #27500A)' }}
              >
                <Image
                  src="/marketing/ata-fruit-white.png"
                  alt="Ata Labs"
                  width={112}
                  height={112}
                  className="mx-auto mb-6 h-auto w-28 opacity-90"
                />
                <p className="mb-1.5 text-2xl font-extrabold leading-none text-white/90">
                  Ata<span className="font-normal text-white/50">Labs</span>
                  <span className="text-verde-broto">·</span>
                </p>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/25">
                  Compartilhando Soluções
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 rounded-2xl border border-cinza-areia bg-white px-5 py-3 shadow-xl">
                <p className="text-xl font-extrabold text-verde-conde">100%</p>
                <p className="text-xs text-cinza-pedra">Feito no Brasil</p>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* CTA BANNER */}
      <FadeUp>
        <section className="bg-verde-broto py-12 md:py-28">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="mb-6 text-3xl font-extrabold leading-tight text-white md:text-6xl">
              Pronto para levar
              <br />
              seu negócio online?
            </h2>
            <p className="mb-10 text-xl leading-relaxed text-white/65">
              Escolha seu plano e comece sua loja em minutos. 14 dias gratuitos, sem cartão de crédito.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-3 rounded-full bg-white px-10 py-5 text-lg font-extrabold text-verde-folha shadow-xl transition-all hover:bg-verde-conde hover:text-white"
            >
              Ver planos
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </section>
      </FadeUp>

      {/* CONTATO */}
      <section id="contato" className="bg-creme py-12 md:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <FadeUp className="mb-14 text-center">
            <SectionEyebrow>Contato</SectionEyebrow>
            <h2 className="mt-4 mb-4 text-3xl font-extrabold text-verde-conde md:text-5xl">
              Fale com a gente
            </h2>
            <p className="text-lg text-cinza-pedra">
              Tem interesse no Ata Commerce? Respondemos em até 24 horas.
            </p>
          </FadeUp>

          <FadeUp>
            <div className="rounded-3xl border border-cinza-areia bg-white p-10 shadow-sm">
              <ContactForm />
            </div>
          </FadeUp>
        </div>
      </section>
    </main>
  );
}
