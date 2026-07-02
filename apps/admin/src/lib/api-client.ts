import { buildStorePath } from '@lojao/store-host';

import { browserApiBase } from './browser-api.js';
export const STOREFRONT_URL = (import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
);

/** Slug da loja autenticada (sessão). Dev: fallback opcional via VITE_STORE_SLUG ou VITE_TENANT_SLUG. */
let sessionStoreSlug: string | null = null;

export function setSessionStoreSlug(slug: string | null): void {
  sessionStoreSlug = slug;
}

export function getSessionStoreSlug(): string | null {
  return sessionStoreSlug;
}

function resolveStoreSlug(explicit?: string): string {
  if (explicit) return explicit;
  if (sessionStoreSlug) return sessionStoreSlug;
  if (import.meta.env.DEV) {
    const fromEnv = import.meta.env.VITE_STORE_SLUG ?? import.meta.env.VITE_TENANT_SLUG;
    if (fromEnv) return fromEnv;
  }
  throw new Error('Loja não identificada — faça login novamente.');
}

/** Prefixo de query keys escopadas à loja ativa na sessão. */
export function storeQueryKey(...parts: readonly unknown[]): readonly unknown[] {
  return ['store', sessionStoreSlug ?? '_none', ...parts] as const;
}

/** URL absoluta da vitrine para um subpath da loja atual. */
export function storefrontProductUrl(produtoId: number, storeSlug?: string): string {
  const slug = storeSlug ?? resolveStoreSlug();
  return `${STOREFRONT_URL}${buildStorePath(slug, `/produto/${produtoId}`)}`;
}

/** Subpath da vitrine (para CTA de banner). */
export function storefrontStorePath(subpath: string, storeSlug?: string): string {
  const slug = storeSlug ?? resolveStoreSlug();
  return buildStorePath(slug, subpath);
}

/** URL absoluta da home da vitrine da loja autenticada. */
export function storefrontHomeUrl(storeSlug?: string): string {
  const slug = storeSlug ?? resolveStoreSlug();
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

/** Contexto de sessão pedido à API (`buyer` na vitrine, `merchant` no admin). */
function authContextHeader(path: string): string {
  return path.startsWith('/api/v1/platform') ? 'platform' : 'merchant';
}

/**
 * fetch com `credentials: 'include'` (cookie de sessão `lojao.sid`).
 * Loja autenticada vem da sessão; envia `X-Store-Slug` quando disponível.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const hasBody = options.body != null && options.body !== '';
  const headers: Record<string, string> = {
    'X-Auth-Context': authContextHeader(path),
    ...((options.headers as Record<string, string> | undefined) ?? {}),
  };
  if (sessionStoreSlug) {
    headers['X-Store-Slug'] = sessionStoreSlug;
  }
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
  const headers: Record<string, string> = {
    'X-Auth-Context': authContextHeader(path),
  };
  if (sessionStoreSlug) {
    headers['X-Store-Slug'] = sessionStoreSlug;
  }

  const res = await fetch(`${browserApiBase()}${path}`, {
    method,
    credentials: 'include',
    headers,
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
