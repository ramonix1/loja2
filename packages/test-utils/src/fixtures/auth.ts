/**
 * Fixtures de autenticação para testes HTTP/E2E (QA).
 *
 * `loginAdmin` faz login programático contra a API Fastify e devolve o header
 * de cookie (`lojao.sid=...`) para reuso em requisições autenticadas.
 *
 * Credenciais dev (nunca usar em produção): admin@loja.com / admin123.
 */
export interface LoginAdminOptions {
  email?: string;
  senha?: string;
}

const DEFAULTS = {
  email: 'admin@loja.com',
  senha: 'admin123',
} as const;

/**
 * Faz POST /api/v1/auth/login e retorna a string de cookie (`lojao.sid=...`)
 * pronta para o header `Cookie`. Lança erro se o login falhar.
 *
 * @param apiUrl Base URL da API (ex.: `http://localhost:3001`).
 */
export async function loginAdmin(apiUrl: string, options: LoginAdminOptions = {}): Promise<string> {
  const { email, senha } = { ...DEFAULTS, ...options };

  const res = await fetch(`${apiUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
