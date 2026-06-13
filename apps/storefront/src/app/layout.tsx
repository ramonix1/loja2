import type { Metadata } from 'next';

import { StoreFooter } from '@/components/layout/store-footer';
import { StoreHeader } from '@/components/layout/store-header';
import { buildStoreMetadata, fetchPublicStore } from '@/lib/api';

import './globals.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const store = await fetchPublicStore();
  return buildStoreMetadata(store);
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const storeData = await fetchPublicStore();
  const cor = storeData.loja.cor_primaria || '#2563eb';

  return (
    <html lang="pt-BR">
      <head>
        {storeData.loja.favicon ? (
          <link rel="icon" href={storeData.loja.favicon} />
        ) : null}
        <style>{`:root { --cor-primaria: ${cor}; }`}</style>
      </head>
      <body>
        <StoreHeader store={storeData.loja} />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <StoreFooter store={storeData.loja} />
      </body>
    </html>
  );
}
