import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Demonstração — Ata Commerce',
  description: 'Teste a vitrine demo do Ata Commerce antes de contratar.',
  openGraph: {
    title: 'Demonstração — Ata Commerce',
    locale: 'pt_BR',
  },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
