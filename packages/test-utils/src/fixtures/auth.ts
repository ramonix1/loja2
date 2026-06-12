/**
 * Fixtures de autenticação para testes HTTP/E2E (QA).
 *
 * `loginAdmin` faz login programático contra a API Fastify e devolve o header
 * de cookie (`lojao.sid=...`) para reuso em requisições autenticadas. A partir
 * da Fase 2, o testador usa isso em `apps/e2e/fixtures/auth.setup.ts`.
 *
 * Credenciais dev (nunca usar em produção): admin@loja.com / admin123.
 */
export interface LoginAdminOptions {
  email?: string;
  senha?: string;
  tenantSlug?: string;
}

const DEFAULTS = {
  email: 'admin@loja.com',
  senha: 'admin123',
  tenantSlug: 'loja',
} as const;

/**
 * Faz POST /api/v1/auth/login e retorna a string de cookie (`lojao.sid=...`)
 * pronta para o header `Cookie`. Lança erro se o login falhar.
 *
 * @param apiUrl Base URL da API (ex.: `http://localhost:3001`).
 */
export async function loginAdmin(apiUrl: string, options: LoginAdminOptions = {}): Promise<string> {
  const { email, senha, tenantSlug } = { ...DEFAULTS, ...options };

  const res = await fetch(`${apiUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Slug': tenantSlug,
    },
    body: JSON.stringify({ email, senha }),
  });

  if (!res.ok) {
    throw new Error(`loginAdmin falhou: HTTP ${res.status}`);
  }

  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error('loginAdmin: resposta sem Set-Cookie (lojao.sid).');
  }

  return setCookie.split(';')[0]!;
}
