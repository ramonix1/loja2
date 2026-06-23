import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import {
  buildStorePath,
  getDefaultStoreSlug,
  parseStorePath,
} from '@lojao/tenant-host';

const LEGACY_EXACT = new Set([
  '/carrinho',
  '/checkout',
  '/login',
  '/cadastro',
  '/meus-pedidos',
  '/recuperar-senha',
  '/dashboard/billing',
]);

function defaultSlug(): string {
  return getDefaultStoreSlug({
    NEXT_PUBLIC_DEFAULT_STORE_SLUG: process.env.NEXT_PUBLIC_DEFAULT_STORE_SLUG,
    NODE_ENV: process.env.NODE_ENV,
  });
}

function legacyRedirect(request: NextRequest, subpath: string): NextResponse {
  const slug = defaultSlug();
  const target = new URL(buildStorePath(slug, subpath), request.url);
  return NextResponse.redirect(target, 301);
}

/**
 * Injeta slug do tenant em rotas `/store/{slug}/...`.
 * Rotas marketing (`/`, `/pricing`, …) não recebem tenant.
 * Paths legados na raiz redirecionam 301 para `/store/{defaultSlug}/...`.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/planos' || pathname.startsWith('/planos/')) {
    const target = new URL(pathname.replace(/^\/planos/, '/pricing'), request.url);
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target, 301);
  }

  const produtoMatch = pathname.match(/^\/produto\/([^/]+)$/);
  if (produtoMatch) {
    return legacyRedirect(request, `/produto/${produtoMatch[1]}`);
  }

  const resultadoMatch = pathname.match(/^\/checkout\/resultado\/([^/]+)$/);
  if (resultadoMatch) {
    return legacyRedirect(request, `/checkout/resultado/${resultadoMatch[1]}`);
  }

  const redefinirMatch = pathname.match(/^\/redefinir-senha\/([^/]+)$/);
  if (redefinirMatch) {
    return legacyRedirect(request, `/redefinir-senha/${redefinirMatch[1]}`);
  }

  if (LEGACY_EXACT.has(pathname)) {
    return legacyRedirect(request, pathname);
  }

  const parsed = parseStorePath(pathname);
  if (parsed.slug) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-slug', parsed.slug);
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set('x-tenant-slug', parsed.slug);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|images/|health).*)'],
};
