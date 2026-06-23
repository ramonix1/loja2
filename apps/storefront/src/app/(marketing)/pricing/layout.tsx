import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Planos — Ata Commerce',
  description: 'Escolha o plano ideal para sua loja virtual. Sem taxa de setup.',
  openGraph: {
    title: 'Planos — Ata Commerce',
    locale: 'pt_BR',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
