import type { NextRequest } from 'next/server';

import { proxyToApi } from '@/lib/api-proxy';

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  return proxyToApi(request, `/images/${path.join('/')}`);
}

export const GET = handle;
export const HEAD = handle;
