'use client';

import { buildStorePath } from '@lojao/tenant-host';

import { useStoreSlug } from '@/lib/store-slug-context';

export function useStoreHref(subpath = '/'): string {
  const slug = useStoreSlug();
  return buildStorePath(slug, subpath);
}

/** Link de login com `?redirect=` apontando para subpath da loja atual. */
export function useStoreLoginHref(redirectSubpath: string): string {
  const slug = useStoreSlug();
  const redirect = encodeURIComponent(buildStorePath(slug, redirectSubpath));
  return `${buildStorePath(slug, '/login')}?redirect=${redirect}`;
}
