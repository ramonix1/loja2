import { marketing as testIds } from '@lojao/test-utils/test-ids/marketing';
import { buildStorePath } from '@lojao/tenant-host';
import Link from 'next/link';

import { BrowserFrame } from '@/components/marketing/browser-frame';
import { FadeUp } from '@/components/marketing/fade-up';
import { SectionEyebrow } from '@/components/marketing/section-eyebrow';

const DEMO_SLUG = 'demo';
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://app.atalabs.com.br';

const DEMO_STORE_PATH = buildStorePath(DEMO_SLUG);

const O_QUE_TESTAR = [
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h8" />
    ),
    title: 'Navegar o catálogo',
    description: 'Explore produtos, categorias e filtros como um comprador real.',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    ),
    title: 'Adicionar ao carrinho',
    description: 'Teste o fluxo completo de carrinho: adicionar, remover e atualizar quantidades.',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    ),
    title: 'Checkout em modo teste',
    description: 'Faça um pedido com pagamento "teste" — sem cobranças reais.',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    ),
    title: 'Ver seus pedidos',
    description: 'Após o checkout, acesse "Meus pedidos" e acompanhe o status em tempo real.',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
    ),
    title: 'Criar uma conta',
    description: 'Cadastre-se e faça login para experimentar a área de comprador autenticada.',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    ),
    title: 'Painel admin demo',
    description: 'Acesse o admin da loja demo para ver pedidos, produtos e relatórios reais.',
  },
] as const;

export default function DemoPage() {
  return (
    <main data-testid={testIds.demoPage}>
      {/* ═══════════ HERO ═══════════ */}
      <section
        className="relative flex min-h-[60vh] items-center overflow-hidden pt-24 pb-20"
        style={{
          background: 'linear-gradient(140deg, #000d2a 0%, #012a7e 50%, #0d5fe0 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #5cb1fe 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <SectionEyebrow>Ata Commerce</SectionEyebrow>
          <h1 className="mt-4 text-5xl font-extrabold text-white md:text-6xl">
            Explore uma loja<br />demo ao vivo.
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg text-white/60">
            Sem cadastro nem cartão. Navegue, adicione ao carrinho e finalize um pedido de teste
            — é a experiência real do Ata Commerce.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              data-testid={testIds.demoOpenStoreLink}
              href={DEMO_STORE_PATH}
              className="inline-flex items-center gap-2 rounded-full px-8 py-4 font-semibold text-white shadow-lg transition-all hover:opacity-90"
              style={{ background: '#2e8ffb' }}
            >
              Abrir loja demo
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-8 py-4 font-semibold text-white transition-colors hover:bg-white/10"
            >
              Ver planos
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ O QUE TESTAR ═══════════ */}
      <section className="bg-azul-nevoa py-24">
        <div className="mx-auto max-w-6xl px-6">
          <FadeUp className="mb-14 text-center">
            <SectionEyebrow>O que você pode testar</SectionEyebrow>
            <h2 className="mt-4 text-4xl font-extrabold text-azul-noite">
              Experiência real, sem risco.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-cinza-pedra">
              A loja demo tem produtos reais, fluxo completo de compra e painel admin — tudo
              funcional para você explorar antes de contratar.
            </p>
          </FadeUp>

          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {O_QUE_TESTAR.map((item) => (
              <FadeUp key={item.title}>
                <div className="rounded-2xl border border-azul-gelo bg-white p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-azul-nevoa">
                    <svg className="h-5 w-5" fill="none" stroke="#0d5fe0" strokeWidth="1.5" viewBox="0 0 24 24">
                      {item.icon}
                    </svg>
                  </div>
                  <h3 className="mb-2 font-extrabold text-azul-noite">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-cinza-pedra">{item.description}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ PREVIEW ═══════════ */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <FadeUp className="mb-14 text-center">
            <SectionEyebrow>Preview</SectionEyebrow>
            <h2 className="mt-4 text-4xl font-extrabold text-azul-noite">
              Veja como fica na prática.
            </h2>
          </FadeUp>

          <FadeUp>
            <div className="grid gap-5 md:grid-cols-2">
              <BrowserFrame
                variant="blue"
                url="atalabs.com.br/store/demo"
                title="Vitrine demo"
                subtitle="Catálogo, produto e carrinho — responsivo em qualquer tela"
                placeholder="Vitrine — disponível após provisionar tenant demo"
              />
              <BrowserFrame
                variant="blue"
                url="app.atalabs.com.br/admin/dashboard"
                title="Painel admin"
                subtitle="Pedidos, produtos e relatórios em tempo real"
                placeholder="Admin — disponível após provisionar tenant demo"
              />
            </div>
          </FadeUp>

          <FadeUp className="mt-10 text-center">
            <Link
              data-testid={`${testIds.demoOpenStoreLink}-preview`}
              href={DEMO_STORE_PATH}
              className="inline-flex items-center gap-2 rounded-full bg-azul-vivido px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-azul-comercio"
            >
              Abrir a vitrine demo ao vivo →
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ═══════════ CREDENCIAIS ADMIN DEMO ═══════════ */}
      <section className="bg-azul-nevoa py-20">
        <div className="mx-auto max-w-3xl px-6">
          <FadeUp className="mb-10 text-center">
            <SectionEyebrow>Acesso admin</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-extrabold text-azul-noite">
              Explore o painel administrativo.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-cinza-pedra">
              Além da vitrine, você pode acessar o painel admin da loja demo e ver os bastidores
              do Ata Commerce.
            </p>
          </FadeUp>

          <FadeUp>
            <div className="overflow-hidden rounded-2xl border border-azul-gelo bg-white">
              <div className="border-b border-azul-gelo bg-azul-nevoa px-6 py-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-azul-noite">
                  Credenciais demo
                </p>
              </div>
              <div className="divide-y divide-azul-gelo/50 px-6">
                {[
                  { label: 'URL do painel', value: `${ADMIN_URL}/login`, isLink: true },
                  { label: 'Slug da loja', value: 'demo', isLink: false },
                  { label: 'Usuário', value: 'admin@demo.com', isLink: false },
                  { label: 'Senha', value: '(solicite via contato)', isLink: false },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-4 text-sm">
                    <span className="text-cinza-pedra">{row.label}</span>
                    {row.isLink ? (
                      <a
                        href={row.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-azul-vivido underline underline-offset-2 hover:text-azul-comercio"
                      >
                        {row.value}
                      </a>
                    ) : (
                      <span className="font-medium text-azul-noite">{row.value}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="border-t border-azul-gelo/50 bg-azul-nevoa/50 px-6 py-3">
                <p className="text-xs text-cinza-pedra">
                  ⚠️ A loja demo é compartilhada — dados podem ser resetados periodicamente.
                  O link pode retornar 404 até o tenant <code className="font-mono">demo</code> ser
                  provisionado (aguarda fase M6 ou seed manual).
                </p>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ═══════════ CTA FINAL ═══════════ */}
      <FadeUp>
        <section className="py-24" style={{ background: '#012a7e' }}>
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="mb-4 text-4xl font-extrabold text-white">
              Gostou do que viu?
            </h2>
            <p className="mb-10 text-lg text-white/60">
              Crie sua própria loja em minutos — sem taxa de setup, sem contrato.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full bg-azul-vivido px-10 py-4 font-extrabold text-white shadow-xl transition-colors hover:bg-azul-ceu"
              >
                Criar minha loja
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/#contato"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-8 py-4 font-semibold text-white transition-colors hover:bg-white/10"
              >
                Falar com a equipe
              </Link>
            </div>
          </div>
        </section>
      </FadeUp>
    </main>
  );
}
