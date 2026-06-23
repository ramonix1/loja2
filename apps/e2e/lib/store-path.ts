import { buildStorePath, getDefaultStoreSlug } from '@lojao/tenant-host';

export const E2E_STORE_SLUG =
  process.env.E2E_STORE_SLUG ??
  getDefaultStoreSlug({ NODE_ENV: process.env.NODE_ENV ?? 'development' });

/** Path da vitrine no Playwright (ex.: `/store/loja/carrinho`). */
export function storePath(subpath = '/'): string {
  return buildStorePath(E2E_STORE_SLUG, subpath);
}
