/**
 * URL da API para fetch SSR (servidor Next).
 * Lê process.env em runtime a cada request.
 *
 * Não usar HOSTNAME do container nem NEXT_PUBLIC_API_URL (browser/localhost).
 * No GHA, HOSTNAME é o ID do container → fetch same-origin quebra com ECONNREFUSED.
 */
export function getSsrApiBase(): string {
  const fromEnv = process.env.API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (
    process.env.SKIP_DOCKER_DEPS_SYNC === 'true' ||
    process.env.GITHUB_ACTIONS === 'true'
  ) {
    return 'http://api:3001';
  }

  return 'http://localhost:3001';
}
