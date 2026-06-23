import { Figtree } from 'next/font/google';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AtaCommerceWordmark } from '@/components/marketing/ata-logo';

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['300', '400', '600', '800'],
  variable: '--font-figtree',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Criar minha loja — Ata Commerce',
    template: '%s · Ata Commerce',
  },
  description: 'Crie sua loja online Ata Commerce com 14 dias de trial grátis, sem cartão.',
  robots: { index: false, follow: true },
};

/**
 * Layout do fluxo self-service (M7). Independente do route group (marketing):
 * header simples (logo + "Voltar aos planos") e sem footer institucional verde,
 * conforme protótipo `checkout.html`.
 */
export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${figtree.variable} flex min-h-screen flex-col bg-azul-nevoa font-sans text-azul-noite antialiased`}>
      <header className="sticky top-0 z-40 border-b border-azul-gelo bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <AtaCommerceWordmark className="text-lg" />
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-cinza-pedra transition-colors hover:text-azul-comercio"
          >
            ← Voltar aos planos
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-azul-gelo bg-white">
        <div className="mx-auto max-w-5xl px-6 py-10 text-center text-sm text-cinza-pedra">
          <p className="text-xs">© 2026 Ata Labs — Ata Commerce. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
