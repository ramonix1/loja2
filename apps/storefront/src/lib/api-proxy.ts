import { NextRequest, NextResponse } from 'next/server';

import { getSsrApiBase } from '@/lib/ssr-fetch';

const FORWARD_REQUEST_HEADERS = ['cookie', 'content-type', 'x-tenant-slug', 'authorization'];

/** Repassa request ao Fastify e devolve resposta (cookies incluídos). */
export async function proxyToApi(
  request: NextRequest,
  upstreamPath: string,
): Promise<NextResponse> {
  // Preflight same-origin (dev): não repassa — browser não precisa de headers CORS.
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204 });
  }

  const apiBase = getSsrApiBase();
  const url = `${apiBase}${upstreamPath}${request.nextUrl.search}`;

  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: 'no-store',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, init);
  } catch (err) {
    console.error('[api-proxy] upstream failed', upstreamPath, err);
    return NextResponse.json(
      { error: 'API indisponível', code: 'API_UNAVAILABLE' },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  const contentType = upstream.headers.get('content-type');
  if (contentType) responseHeaders.set('content-type', contentType);

  const setCookies = upstream.headers.getSetCookie?.() ?? [];
  if (setCookies.length > 0) {
    for (const cookie of setCookies) {
      responseHeaders.append('set-cookie', cookie);
    }
  } else {
    const setCookie = upstream.headers.get('set-cookie');
    if (setCookie) responseHeaders.set('set-cookie', setCookie);
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
