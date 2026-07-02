import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { storeCacheTag } from '@/lib/cache-tags';

interface RevalidateBody {
  secret?: string;
  slug?: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  const expected = process.env.STOREFRONT_REVALIDATE_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: 'Revalidação não configurada.', code: 'NOT_CONFIGURED' },
      { status: 503 },
    );
  }

  let body: RevalidateBody;
  try {
    body = (await request.json()) as RevalidateBody;
  } catch {
    return NextResponse.json({ error: 'JSON inválido.', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  if (body.secret !== expected) {
    return NextResponse.json({ error: 'Não autorizado.', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const slug = body.slug?.trim();
  if (!slug) {
    return NextResponse.json({ error: 'slug obrigatório.', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  revalidateTag(storeCacheTag(slug));
  revalidatePath(`/store/${slug}`, 'layout');

  return NextResponse.json({ data: { revalidated: true, slug } });
}
