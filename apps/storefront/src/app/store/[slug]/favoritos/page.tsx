import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** @deprecated Use `/wishlist`. */
export default async function LegacyFavoritosRedirect({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/store/${slug}/wishlist`);
}
