/**
 * URL da API para fetch SSR e proxy runtime (servidor Next).
 * Lê process.env a cada request — não depende de rewrites do next.config (build-time).
 */
export function getSsrApiBase(): string {
  const fromEnv = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (
    process.env.SKIP_DOCKER_DEPS_SYNC === 'true' ||
    process.env.GITHUB_ACTIONS === 'true'
  ) {
    return 'http://api:3001';
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'API_URL ou NEXT_PUBLIC_API_URL obrigatório em produção (storefront → API Render).',
    );
  }

  return 'http://localhost:3001';
}
