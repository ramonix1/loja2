import type { FastifyBaseLogger, FastifyRequest } from 'fastify';

function storefrontBaseUrl(): string {
  return (
    process.env.STOREFRONT_INTERNAL_URL ??
    process.env.STOREFRONT_URL ??
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

/** Dispara revalidação ISR da vitrine Next (fire-and-forget). */
export async function revalidateStorefront(
  slug: string,
  log?: FastifyBaseLogger,
): Promise<void> {
  const secret = process.env.STOREFRONT_REVALIDATE_SECRET;
  if (!secret) {
    log?.warn('STOREFRONT_REVALIDATE_SECRET ausente — vitrine não revalidada on-demand');
    return;
  }

  const url = `${storefrontBaseUrl()}/api/revalidate`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, slug }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      log?.warn({ status: res.status, body: text }, 'storefront revalidate falhou');
    }
  } catch (err) {
    log?.warn({ err }, 'storefront revalidate erro de rede');
  }
}

export function afterStoreMutation(request: FastifyRequest): void {
  const slug = request.storeSlug;
  if (!slug) return;
  void revalidateStorefront(slug, request.log);
}
