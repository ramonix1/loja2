import type { Metadata } from 'next';

import { StoreHomeClient } from '@/components/store-home-client';
import { buildStoreMetadata, fetchPublicBanners, fetchPublicStore } from '@/lib/api';

export const revalidate = 30;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await fetchPublicStore(slug);
  return buildStoreMetadata(store, slug);
}

export default async function StoreHomePage({ params }: PageProps) {
  const { slug } = await params;
  const [store, banners] = await Promise.all([fetchPublicStore(slug), fetchPublicBanners(slug)]);

  return <StoreHomeClient store={store} banners={banners} storeSlug={slug} />;
}
