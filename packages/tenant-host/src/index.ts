export const STORE_PREFIX = '/store';

export interface ParsedStorePath {
  slug: string | null;
  /** Subpath após `/store/{slug}` (ex.: `/carrinho`, `/produto/1`). */
  storePath: string | null;
}

/** Normaliza pathname (remove query/hash, garante leading slash). */
export function normalizePathname(pathname: string): string {
  const base = pathname.split(/[?#]/)[0] ?? '/';
  if (!base || base === '/') return '/';
  const withSlash = base.startsWith('/') ? base : `/${base}`;
  if (withSlash.length > 1 && withSlash.endsWith('/')) {
    return withSlash.slice(0, -1);
  }
  return withSlash;
}

export function parseStorePath(pathname: string): ParsedStorePath {
  const path = normalizePathname(pathname);
  const match = path.match(/^\/store\/([^/]+)(\/.*)?$/);
  if (!match) {
    return { slug: null, storePath: null };
  }

  const slug = match[1] ?? null;
  const rest = match[2] ?? '/';
  return { slug, storePath: rest };
}

export function buildStorePath(slug: string, subpath = '/'): string {
  const trimmedSlug = slug.trim();
  if (!trimmedSlug) {
    throw new Error('buildStorePath: slug é obrigatório');
  }

  const normalized = subpath.startsWith('/') ? subpath : `/${subpath}`;
  if (normalized === '/') {
    return `${STORE_PREFIX}/${trimmedSlug}`;
  }
  return `${STORE_PREFIX}/${trimmedSlug}${normalized}`;
}

/** Slug padrão para redirects legado e links de vitrine demo. */
export function getDefaultStoreSlug(
  env: {
    NEXT_PUBLIC_DEFAULT_STORE_SLUG?: string;
    NODE_ENV?: string;
  } = {},
): string {
  const fromEnv = env.NEXT_PUBLIC_DEFAULT_STORE_SLUG?.trim();
  if (fromEnv) return fromEnv;
  return env.NODE_ENV === 'production' ? 'demo' : 'loja';
}

export function isStorePath(pathname: string): boolean {
  return parseStorePath(pathname).slug != null;
}
