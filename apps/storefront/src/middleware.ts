import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Injeta slug do tenant. Auth de rotas protegidas fica no client (cookie `lojao.sid`
 * é do domínio da API — middleware não enxerga em cross-origin).
 */
export function middleware(request: NextRequest) {
  const slug =
    process.env.TENANT_SLUG ??
    process.env.NEXT_PUBLIC_TENANT_SLUG ??
    request.headers.get('x-tenant-slug') ??
    'loja';

  const response = NextResponse.next();
  response.headers.set('x-tenant-slug', slug);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|images/).*)'],
};
