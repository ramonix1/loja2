import type { PublicBanner, PublicProduct, PublicStoreData } from '@lojao/types/public-store';
import type { Metadata } from 'next';
import { cache } from 'react';

import { getServerApiUrl } from '@/lib/server-api-url';

const TENANT_SLUG = process.env.TENANT_SLUG ?? process.env.NEXT_PUBLIC_TENANT_SLUG ?? 'loja';

export function assetUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // URLs exibidas no browser — sempre host público, não API_URL interna do Docker
  const base = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
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

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${getServerApiUrl()}${path}`, {
    headers: { 'X-Tenant-Slug': TENANT_SLUG },
    cache: 'no-store',
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

export function getTenantSlug(): string {
  return TENANT_SLUG;
}

export const fetchPublicStore = cache(async (): Promise<PublicStoreData> => {
  const { data } = await fetchApi<{ data: PublicStoreData }>('/api/v1/public/store');
  return data;
});

export const fetchPublicBanners = cache(async (): Promise<PublicBanner[]> => {
  const { data } = await fetchApi<{ data: PublicBanner[] }>('/api/v1/public/banners');
  return data;
});

export async function fetchPublicProduct(id: number): Promise<PublicProduct | null> {
  try {
    const { data } = await fetchApi<{ data: PublicProduct & { descricao?: string; imagens?: unknown[] } }>(
      `/api/v1/public/products/${id}`,
    );
    return data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function fetchPublicProductDetail(id: number) {
  try {
    const { data } = await fetchApi<{
      data: PublicProduct & {
        descricao: string | null;
        imagens: Array<{ id: number; url: string }>;
      };
    }>(`/api/v1/public/products/${id}`);
    return data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export function buildStoreMetadata(store: PublicStoreData): Metadata {
  const title = store.loja.nome;
  const description =
    store.loja.slogan || `${store.loja.nome} — produtos de qualidade com entrega para todo o Brasil.`;

  return {
    title: { default: title, template: `%s | ${title}` },
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

export const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Todos os produtos da home (categorias + sem categoria), deduplicados. */
export function flattenStoreProducts(store: PublicStoreData): PublicProduct[] {
  const map = new Map<number, PublicProduct>();
  for (const cat of store.categorias) {
    for (const p of cat.produtos) map.set(p.id, p);
  }
  for (const p of store.produtos_sem_categoria) map.set(p.id, p);
  return [...map.values()];
}
