import { getServerApiUrl } from '@/lib/server-api-url';

/** Browser: paths relativos (rewrites Next). Servidor: host interno Docker via API_URL. */
export const API_URL = typeof window !== 'undefined' ? '' : getServerApiUrl();

export const TENANT_SLUG =
  process.env.TENANT_SLUG ?? process.env.NEXT_PUBLIC_TENANT_SLUG ?? 'loja';

export const IS_DEV = process.env.NODE_ENV !== 'production';
