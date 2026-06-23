import { Figtree } from 'next/font/google';
import type { Metadata } from 'next';

import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { MarketingHeader } from '@/components/marketing/marketing-header';

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['300', '400', '600', '800'],
  variable: '--font-figtree',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Ata Labs — Compartilhando Soluções',
    template: '%s · Ata Labs',
  },
  description:
    'Soluções digitais para pequenos e médios negócios. Conheça o Ata Commerce.',
  openGraph: {
    siteName: 'Ata Labs',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${figtree.variable} min-h-screen font-sans antialiased`}>
      {/*
        O variant é definido por cada página via contexto ou prop.
        O layout raiz usa over-hero para a landing (hero verde cobre o header).
        Páginas internas (pricing, ata-commerce…) podem usar solid via seu próprio header.
        Por ora, over-hero aqui é correto pois a landing é a única página do route group.
        M3/M4/M5 terão seus próprios headers ou trocarão via contexto.
      */}
      <MarketingHeader variant="over-hero" />
      {children}
      <MarketingFooter />
    </div>
  );
}
