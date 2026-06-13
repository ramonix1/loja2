/** Paths relativos — Next.js rewrites proxiam /api/v1 e /images para a API. */
export const API_URL = '';

export const TENANT_SLUG =
  process.env.TENANT_SLUG ?? process.env.NEXT_PUBLIC_TENANT_SLUG ?? 'loja';

export const IS_DEV = process.env.NODE_ENV !== 'production';
