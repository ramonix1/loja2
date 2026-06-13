/** URL da API para SSR/middleware — nunca usar NEXT_PUBLIC_* (é localhost do browser). */
export function getServerApiUrl(): string {
  return process.env.API_URL ?? 'http://localhost:3001';
}
