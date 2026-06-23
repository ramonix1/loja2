/**
 * URL da API para chamadas do browser (cross-origin com credentials).
 * Cookie `lojao.sid` fica no domínio da API — compartilhado entre storefront e admin.
 */
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
).replace(/\/$/, '');

export const IS_DEV = process.env.NODE_ENV !== 'production';

/**
 * Base URL para fetch no browser (client components).
 * Dev: '' → proxy same-origin do Next (`/api/v1/*`), sem CORS.
 * Prod: NEXT_PUBLIC_API_URL (cross-origin + CORS na API).
 */
export function browserApiBase(): string {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    return '';
  }
  return API_URL;
}

/** URL do painel admin React (static site separado em produção). */
export function adminDashboardUrl(): string {
  const base = (process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:5173').replace(/\/$/, '');
  return `${base}/admin/dashboard`;
}
