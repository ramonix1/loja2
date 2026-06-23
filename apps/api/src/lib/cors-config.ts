/**
 * Política CORS centralizada da API.
 *
 * Dev: libera localhost / 127.0.0.1 / [::1] (qualquer porta) além da allowlist.
 * Prod: apenas origens explícitas (env + APP_URL / ADMIN_URL / STOREFRONT_URL).
 *
 * Frontends em dev devem preferir proxy same-origin (Vite / Next) — CORS fica
 * fallback para Socket.io, ferramentas externas e builds sem proxy.
 */

const LOCAL_ORIGIN =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

export function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/$/, '');
}

/** Origens explícitas (produção + dev quando configuradas). */
export function collectCorsOrigins(): string[] {
  const explicit =
    process.env.CORS_ORIGINS?.split(',')
      .map(normalizeOrigin)
      .filter(Boolean) ?? [];

  const fromAppEnv = [
    process.env.APP_URL,
    process.env.ADMIN_URL,
    process.env.STOREFRONT_URL,
  ]
    .filter((url): url is string => Boolean(url?.trim()))
    .map(normalizeOrigin);

  return [...new Set([...explicit, ...fromAppEnv])];
}

/** Valida se o browser pode chamar a API com credentials. */
export function isOriginAllowed(origin: string | undefined): boolean {
  // curl, SSR, health checks — sem header Origin.
  if (!origin) return true;

  const normalized = normalizeOrigin(origin);
  if (collectCorsOrigins().includes(normalized)) return true;

  if (process.env.NODE_ENV !== 'production' && LOCAL_ORIGIN.test(normalized)) {
    return true;
  }

  return false;
}

/** Opções compartilhadas por @fastify/cors e Socket.io. */
export const CORS_ALLOWED_METHODS = [
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
];

export const CORS_ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Tenant-Slug',
  'Idempotency-Key',
];

export function corsPluginOptions() {
  return {
    origin(origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) {
      cb(null, isOriginAllowed(origin));
    },
    credentials: true as const,
    methods: [...CORS_ALLOWED_METHODS],
    allowedHeaders: [...CORS_ALLOWED_HEADERS],
  };
}

/** Origins explícitas para Socket.io (array estático + validação dinâmica no handshake). */
export function socketIoCorsOrigins(): string[] {
  return collectCorsOrigins();
}
