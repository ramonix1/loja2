/**
 * Base URL para chamadas HTTP no browser (admin).
 *
 * Dev: paths relativos → proxy Vite (`/api`, `/images`) same-origin, sem CORS.
 * Prod: `VITE_API_URL` (cross-origin; API libera origem via CORS + cookie SameSite).
 */
export function browserApiBase(): string {
  if (import.meta.env.DEV) return '';
  const url = import.meta.env.VITE_API_URL?.trim();
  return url ? url.replace(/\/$/, '') : '';
}

/** URL do Socket.IO — dev usa same-origin (proxy ws); prod aponta para a API. */
export function chatSocketUrl(): string {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return window.location.origin;
  }
  const url = import.meta.env.VITE_API_URL?.trim();
  return (url ?? 'http://localhost:3001').replace(/\/$/, '');
}
