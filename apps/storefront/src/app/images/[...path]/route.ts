import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { proxyToApi } from '@/lib/api-proxy';

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  const cdnBase = process.env.NEXT_PUBLIC_CDN_URL?.replace(/\/$/, '');

  if (cdnBase) {
    const target = `${cdnBase}/images/${path.join('/')}${request.nextUrl.search}`;
    return NextResponse.redirect(target, 301);
  }

  return proxyToApi(request, `/images/${path.join('/')}`);
}

export const GET = handle;
export const HEAD = handle;
