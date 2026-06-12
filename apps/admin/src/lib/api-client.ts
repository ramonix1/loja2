const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
const TENANT_SLUG = import.meta.env.VITE_TENANT_SLUG ?? 'loja';

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
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Slug': TENANT_SLUG,
      ...options.headers,
    },
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
