const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
const TENANT_SLUG = import.meta.env.VITE_TENANT_SLUG ?? 'loja';
export const STOREFRONT_URL = (import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
);

/** URL absoluta para imagens uploadadas (`/images/...` servidas pela API). */
export function assetImageUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
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
 * fetch com `credentials: 'include'` (cookie de sessão `lojao.sid`) e header
 * `X-Tenant-Slug`. Lança `ApiError` em respostas não-2xx, preservando o `code`
 * do contrato da API (`{ error, code }`).
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const hasBody = options.body != null && options.body !== '';
  const headers: Record<string, string> = {
    'X-Tenant-Slug': TENANT_SLUG,
    ...((options.headers as Record<string, string> | undefined) ?? {}),
  };
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_URL}${path}`, {
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
  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    headers: { 'X-Tenant-Slug': TENANT_SLUG },
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
