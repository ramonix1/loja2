/** Tag Next.js ISR — invalidada via POST /api/revalidate quando o lojista altera a vitrine. */
export function storeCacheTag(slug: string): string {
  return `store:${slug}`;
}
