import { buildStorePath } from '@lojao/tenant-host';

import { browserApiBase } from './browser-api.js';
export const STOREFRONT_URL = (import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
);

/** Slug do tenant autenticado (sessão). Dev: fallback opcional via VITE_TENANT_SLUG. */
let sessionTenantSlug: string | null = null;

export function setSessionTenantSlug(slug: string | null): void {
  sessionTenantSlug = slug;
}

function resolveTenantSlug(explicit?: string): string {
  if (explicit) return explicit;
  if (sessionTenantSlug) return sessionTenantSlug;
  if (import.meta.env.DEV && import.meta.env.VITE_TENANT_SLUG) {
    return import.meta.env.VITE_TENANT_SLUG;
  }
  throw new Error('Tenant não identificado — faça login novamente.');
}

/** URL absoluta da vitrine para um subpath da loja atual. */
export function storefrontProductUrl(produtoId: number, tenantSlug?: string): string {
  const slug = tenantSlug ?? resolveTenantSlug();
  return `${STOREFRONT_URL}${buildStorePath(slug, `/produto/${produtoId}`)}`;
}

/** Subpath da vitrine (para CTA de banner). */
export function storefrontStorePath(subpath: string, tenantSlug?: string): string {
  const slug = tenantSlug ?? resolveTenantSlug();
  return buildStorePath(slug, subpath);
}

/** URL absoluta da home da vitrine do tenant autenticado. */
export function storefrontHomeUrl(tenantSlug?: string): string {
  const slug = tenantSlug ?? resolveTenantSlug();
  return `${STOREFRONT_URL}${buildStorePath(slug, '/')}`;
}

/** URL absoluta da vitrine para um slug arbitrário (Platform Hub). */
export function storefrontUrlForSlug(slug: string): string {
  return `${STOREFRONT_URL}${buildStorePath(slug, '/')}`;
}

/** URL absoluta para imagens — CDN em produção; API só em dev/proxy legado. */
export function assetImageUrl(path: string): string {
  if (path.startsWith('http')) return path;

  const normalized = path.startsWith('/') ? path : `/${path}`;

  if (normalized.startsWith('/images/')) {
    const cdn = import.meta.env.VITE_CDN_URL?.replace(/\/$/, '');
    if (cdn) return `${cdn}${normalized}`;
  }

  return `${browserApiBase()}${normalized}`;
}

/** @deprecated use assetImageUrl */
export const legacyImageUrl = assetImageUrl;

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

/**
 * fetch com `credentials: 'include'` (cookie de sessão `lojao.sid`).
 * Tenant autenticado vem da sessão; no login envie `tenantSlug` no body.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const hasBody = options.body != null && options.body !== '';
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string> | undefined) ?? {}),
  };
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${browserApiBase()}${path}`, {
    ...options,
    credentials: 'include',
    headers,
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

/** POST/PUT multipart (upload de imagem) — não define Content-Type (boundary automático). */
export async function apiUpload<T>(path: string, formData: FormData, method = 'POST'): Promise<T> {
  const res = await fetch(`${browserApiBase()}${path}`, {
    method,
    credentials: 'include',
    body: formData,
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
