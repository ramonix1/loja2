import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** @deprecated Use `/cart`. */
export default async function LegacyCartRedirect({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/store/${slug}/cart`);
}
