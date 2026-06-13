import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/carrinho', '/checkout', '/meus-pedidos', '/dashboard/billing'];

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
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
    const cookie = request.headers.get('cookie') ?? '';
    const meRes = await fetch(`${API_URL}/api/v1/auth/me`, {
      headers: { cookie, 'X-Tenant-Slug': TENANT_SLUG },
      cache: 'no-store',
    });

    if (!meRes.ok) {
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
