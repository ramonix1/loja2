import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/carrinho', '/checkout', '/meus-pedidos', '/dashboard/billing'];

const TENANT_SLUG = process.env.TENANT_SLUG ?? process.env.NEXT_PUBLIC_TENANT_SLUG ?? 'loja';

/**
 * Injeta slug do tenant e protege rotas autenticadas do comprador.
 */
export async function middleware(request: NextRequest) {
  const slug =
    process.env.TENANT_SLUG ??
    process.env.NEXT_PUBLIC_TENANT_SLUG ??
    request.headers.get('x-tenant-slug') ??
    'loja';

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isProtected) {
    try {
      const meUrl = new URL('/api/v1/auth/me', request.url);
      const meRes = await fetch(meUrl, {
        headers: { cookie: request.headers.get('cookie') ?? '', 'X-Tenant-Slug': TENANT_SLUG },
        cache: 'no-store',
      });

      if (!meRes.ok) {
        const login = request.nextUrl.clone();
        login.pathname = '/login';
        login.searchParams.set('redirect', pathname);
        return NextResponse.redirect(login);
      }
    } catch (err) {
      console.error('[middleware] auth check failed', err);
      const login = request.nextUrl.clone();
      login.pathname = '/login';
      login.searchParams.set('redirect', pathname);
      return NextResponse.redirect(login);
    }
  }

  const response = NextResponse.next();
  response.headers.set('x-tenant-slug', slug);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|images/).*)'],
};
