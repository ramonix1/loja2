/** Paths relativos — Next.js rewrites proxiam /api/v1 e /images para a API. */
export const API_URL = '';

export const TENANT_SLUG =
  process.env.TENANT_SLUG ?? process.env.NEXT_PUBLIC_TENANT_SLUG ?? 'loja';

export const IS_DEV = process.env.NODE_ENV !== 'production';

/** URL do painel admin React (static site separado em produção). */
export function adminDashboardUrl(): string {
  const base = (process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:5173').replace(/\/$/, '');
  return `${base}/admin/dashboard`;
}
