/**
 * Base URL para fetch SSR no servidor Next.
 * Usa same-origin para acionar rewrites (/api/v1 → API_URL interna no Docker).
 * Evita localhost:3001 (porta da API) e paths relativos (inválidos no fetch do Node).
 */
export function getSsrFetchOrigin(): string {
  const port = process.env.PORT ?? '3000';
  const host = process.env.HOSTNAME ?? '127.0.0.1';
  return `http://${host}:${port}`;
}
