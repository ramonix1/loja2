import type { PublicBanner, PublicProduct, PublicStoreData } from '@lojao/types/public-store';
import type { Metadata } from 'next';
import { cache } from 'react';

import { getDefaultStoreSlug } from '@lojao/tenant-host';

import { getSsrApiBase } from '@/lib/ssr-fetch';

/** Segundos de cache ISR para dados públicos (home, produto). */
const PUBLIC_REVALIDATE_SEC = Number(process.env.STOREFRONT_PUBLIC_REVALIDATE ?? 60);

export function assetUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;

  const normalized = path.startsWith('/') ? path : `/${path}`;

  if (normalized.startsWith('/images/')) {
    const cdnBase = process.env.NEXT_PUBLIC_CDN_URL?.replace(/\/$/, '');
    if (cdnBase) return `${cdnBase}${normalized}`;

    const apiPublic = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
    if (apiPublic) return `${apiPublic}${normalized}`;
  }

  return normalized;
}

/** @deprecated use assetUrl */
export const legacyAssetUrl = assetUrl;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  path: string,
  slug: string,
  options?: { revalidate?: number | false },
): Promise<T> {
  const revalidate = options?.revalidate ?? PUBLIC_REVALIDATE_SEC;
  const res = await fetch(`${getSsrApiBase()}${path}`, {
    headers: { 'X-Tenant-Slug': slug },
    ...(revalidate === false
      ? { cache: 'no-store' as const }
      : { next: { revalidate } }),
  });

  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
  } & Record<string, unknown>;

  if (!res.ok) {
    throw new ApiError(res.status, body.code ?? 'INTERNAL_ERROR', body.error ?? 'Erro inesperado.');
  }

  return body as T;
}

/** Slug dev/test — não usar em produção (tenant vem do path). */
export function getDevFallbackSlug(): string {
  return (
    process.env.TENANT_SLUG ??
    getDefaultStoreSlug({
      NEXT_PUBLIC_DEFAULT_STORE_SLUG: process.env.NEXT_PUBLIC_DEFAULT_STORE_SLUG,
      NODE_ENV: process.env.NODE_ENV,
    })
  );
}

export const fetchPublicStore = cache(async (slug: string): Promise<PublicStoreData> => {
  const { data } = await fetchApi<{ data: PublicStoreData }>('/api/v1/public/store', slug);
  return data;
});

export const fetchPublicBanners = cache(async (slug: string): Promise<PublicBanner[]> => {
  const { data } = await fetchApi<{ data: PublicBanner[] }>('/api/v1/public/banners', slug);
  return data;
});

export async function fetchPublicProduct(
  slug: string,
  id: number,
): Promise<PublicProduct | null> {
  try {
    const { data } = await fetchApi<{ data: PublicProduct & { descricao?: string; imagens?: unknown[] } }>(
      `/api/v1/public/products/${id}`,
      slug,
    );
    return data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function fetchPublicProductDetail(slug: string, id: number) {
  return fetchPublicProductDetailCached(slug, id);
}

const fetchPublicProductDetailCached = cache(async (slug: string, id: number) => {
  try {
    const { data } = await fetchApi<{
      data: PublicProduct & {
        descricao: string | null;
        imagens: Array<{ id: number; url: string }>;
      };
    }>(`/api/v1/public/products/${id}`, slug);
    return data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
});

export function buildStoreMetadata(store: PublicStoreData, slug?: string): Metadata {
  const title = store.loja.nome;
  const description =
    store.loja.slogan || `${store.loja.nome} — produtos de qualidade com entrega para todo o Brasil.`;

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  const canonical =
    siteUrl && slug ? `${siteUrl}/store/${slug}` : undefined;

  return {
    title: { default: title, template: `%s | ${title}` },
    description,
    ...(store.loja.favicon
      ? { icons: { icon: assetUrl(store.loja.favicon) } }
      : {}),
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

export const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function flattenStoreProducts(store: PublicStoreData): PublicProduct[] {
  const map = new Map<number, PublicProduct>();
  for (const cat of store.categorias) {
    for (const p of cat.produtos) map.set(p.id, p);
  }
  for (const p of store.produtos_sem_categoria) map.set(p.id, p);
  return [...map.values()];
}
