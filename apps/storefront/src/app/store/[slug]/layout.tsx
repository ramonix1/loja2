import { store as testIds } from '@lojao/test-utils/test-ids/store';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { DEFAULT_LOJA_COR_PRIMARIA, storeShellClasses } from '@/lib/store-styles';
import { StoreFooter } from '@/components/layout/store-footer';
import { StoreHeader } from '@/components/layout/store-header';
import { ApiError, buildStoreMetadata, fetchPublicStore } from '@/lib/api';
import { StoreSlugProvider } from '@/lib/store-slug-context';
import { parseStoreTheme } from '@lojao/types/store-theme';

export const revalidate = 60;

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const store = await fetchPublicStore(slug);
    return buildStoreMetadata(store, slug);
  } catch {
    return { title: 'Loja não encontrada' };
  }
}

export default async function StoreLayout({ children, params }: LayoutProps) {
  const { slug } = await params;

  let storeData;
  try {
    storeData = await fetchPublicStore(slug);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.code === 'TENANT_NOT_FOUND')) {
      notFound();
    }
    throw e;
  }

  const cor = storeData.loja.cor_primaria || DEFAULT_LOJA_COR_PRIMARIA;
  const tema = parseStoreTheme(storeData.loja.tema);
  const shell = storeShellClasses(tema);

  return (
    <StoreSlugProvider slug={slug}>
      <div
        data-testid={testIds.slugLayout}
        data-store-theme={tema}
        className={`flex min-h-screen flex-col ${shell.page}`}
      >
        <style>{`:root { --cor-primaria: ${cor}; }`}</style>
        <StoreHeader store={storeData.loja} storeSlug={slug} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <StoreFooter store={storeData.loja} />
      </div>
    </StoreSlugProvider>
  );
}
