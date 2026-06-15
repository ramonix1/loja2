/** Paths relativos — Route Handlers em `/api/v1` e `/images` proxiam para a API em runtime. */
export const API_URL = '';

export const TENANT_SLUG =
  process.env.TENANT_SLUG ?? process.env.NEXT_PUBLIC_TENANT_SLUG ?? 'loja';

export const IS_DEV = process.env.NODE_ENV !== 'production';

/** URL do painel admin React (static site separado em produção). */
export function adminDashboardUrl(): string {
  const base = (process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:5173').replace(/\/$/, '');
  return `${base}/admin/dashboard`;
}
