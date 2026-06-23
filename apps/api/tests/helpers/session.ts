import type { FastifyInstance, InjectOptions, LightMyRequestResponse } from 'fastify';

import {
  TEST_ADMIN_EMAIL,
  TEST_ADMIN_SENHA,
  TEST_TENANT_SLUG,
  TEST_USER_EMAIL,
  TEST_USER_SENHA,
} from './seed.js';

export const TENANT_HEADER = { 'x-tenant-slug': TEST_TENANT_SLUG };

/** Extrai o cookie `lojao.sid` (encoded) de uma resposta para reenvio. */
export function extractSessionCookie(res: LightMyRequestResponse): string {
  const setCookie = res.headers['set-cookie'];
  const header = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  if (!header) throw new Error('Resposta sem Set-Cookie (lojao.sid).');
  return header.split(';')[0]!;
}

/** Faz login do admin via inject e retorna o cookie de sessão para reuso. */
export async function loginAdminCookie(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      email: TEST_ADMIN_EMAIL,
      senha: TEST_ADMIN_SENHA,
      tenantSlug: TEST_TENANT_SLUG,
    },
  });
  if (res.statusCode !== 200) {
    throw new Error(`Login de teste falhou (${res.statusCode}): ${res.body}`);
  }
  return extractSessionCookie(res);
}

/** Login de um usuário comum (role `usuario`); retorna o cookie de sessão. */
export async function loginUserCookie(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      email: TEST_USER_EMAIL,
      senha: TEST_USER_SENHA,
      tenantSlug: TEST_TENANT_SLUG,
    },
  });
  if (res.statusCode !== 200) {
    throw new Error(`Login de usuário comum falhou (${res.statusCode}): ${res.body}`);
  }
  return extractSessionCookie(res);
}

/** Helper de inject já com header de tenant aplicado. */
export function injectWithTenant(
  app: FastifyInstance,
  opts: InjectOptions & { headers?: Record<string, string> },
): ReturnType<FastifyInstance['inject']> {
  return app.inject({
    ...opts,
    headers: { ...TENANT_HEADER, ...opts.headers },
  });
}
