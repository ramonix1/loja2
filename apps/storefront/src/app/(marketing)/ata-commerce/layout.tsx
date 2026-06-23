import type { Metadata } from 'next';

/**
 * Layout scoped para /ata-commerce.
 * Header e Footer vêm do layout pai (marketing)/layout.tsx.
 * Este nível apenas define metadata da sub-rota e aplica classe de tema.
 */
export const metadata: Metadata = {
  title: 'Ata Commerce — Loja virtual whitelabel',
  description:
    'E-commerce completo com pagamentos brasileiros, gestão de pedidos e multi-lojas.',
  openGraph: {
    title: 'Ata Commerce — Loja virtual whitelabel',
    locale: 'pt_BR',
  },
};

export default function AtaCommerceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
