import { notFound } from 'next/navigation';

import { WishlistPageShell } from '@/components/store/wishlist-page-client';
import { ApiError, fetchPublicStore } from '@/lib/api';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function WishlistPage({ params }: PageProps) {
  const { slug } = await params;

  try {
    const store = await fetchPublicStore(slug);
    return <WishlistPageShell controlaEstoque={store.controla_estoque} />;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.code === 'TENANT_NOT_FOUND')) {
      notFound();
    }
    throw e;
  }
}
