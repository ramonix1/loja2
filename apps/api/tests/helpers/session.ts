import type { FastifyInstance, InjectOptions, LightMyRequestResponse } from 'fastify';

import {
  TEST_ADMIN_EMAIL,
  TEST_ADMIN_SENHA,
  TEST_STORE_SLUG,
  TEST_USER_EMAIL,
  TEST_USER_SENHA,
} from './seed.js';

export const STORE_HEADER = { 'x-store-slug': TEST_STORE_SLUG };

/** @deprecated MA8 — use `STORE_HEADER` (`x-store-slug`). */
export const TENANT_HEADER = STORE_HEADER;

/** Extrai o cookie `lojao.sid` (encoded) de uma resposta para reenvio. */
export function extractSessionCookie(res: LightMyRequestResponse): string {
  const setCookie = res.headers['set-cookie'];
  const header = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  if (!header) throw new Error('Resposta sem Set-Cookie (lojao.sid).');
  return header.split(';')[0]!;
}

/**
 * Login do owner merchant (`merchant_members`) via inject.
 * Se o login retornar `select_store`, seleciona automaticamente `TEST_STORE_SLUG`.
 */
export async function loginAdminCookie(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      email: TEST_ADMIN_EMAIL,
      senha: TEST_ADMIN_SENHA,
    },
  });
  if (res.statusCode !== 200) {
    throw new Error(`Login de teste falhou (${res.statusCode}): ${res.body}`);
  }

  let cookie = extractSessionCookie(res);
  const body = res.json() as { data?: { step?: string } };

  if (body.data?.step === 'select_store') {
    const selectRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/select-store',
      headers: { cookie },
      payload: { storeSlug: TEST_STORE_SLUG },
    });
    if (selectRes.statusCode !== 200) {
      throw new Error(`select-store falhou (${selectRes.statusCode}): ${selectRes.body}`);
    }
    cookie = extractSessionCookie(selectRes);
  }

  return cookie;
}

/** Login de comprador (`buyers`) com loja explícita; retorna o cookie de sessão. */
export async function loginUserCookie(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    headers: { ...STORE_HEADER },
    payload: {
      email: TEST_USER_EMAIL,
      senha: TEST_USER_SENHA,
      storeSlug: TEST_STORE_SLUG,
    },
  });
  if (res.statusCode !== 200) {
    throw new Error(`Login de usuário comum falhou (${res.statusCode}): ${res.body}`);
  }
  return extractSessionCookie(res);
}

/** Helper de inject já com header de loja (`x-store-slug`). */
export function injectWithStore(
  app: FastifyInstance,
  opts: InjectOptions & { headers?: Record<string, string> },
): ReturnType<FastifyInstance['inject']> {
  return app.inject({
    ...opts,
    headers: { ...STORE_HEADER, ...opts.headers },
  });
}

/** @deprecated MA8 — use `injectWithStore`. */
export function injectWithTenant(
  app: FastifyInstance,
  opts: InjectOptions & { headers?: Record<string, string> },
): ReturnType<FastifyInstance['inject']> {
  return injectWithStore(app, opts);
}
