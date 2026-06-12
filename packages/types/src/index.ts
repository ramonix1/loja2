/**
 * Tipos base do Lojão.
 *
 * Stubs mínimos da Fase 0 — apenas o contrato. As interfaces de domínio
 * (Tenant, Usuario) e o envelope de resposta da API evoluem a partir da Fase 1,
 * quando auth/tenant entram no Fastify. Não adicionar lógica aqui.
 */

/** Loja (tenant) do SaaS multi-tenant. Identificada por `slug`. */
export interface Tenant {
  id: number;
  slug: string;
  nome: string;
  ativo: boolean;
}

/** Usuário autenticado (admin da loja ou comprador). */
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: 'admin' | 'usuario';
}

/** Envelope de sucesso da API: `{ data }`. */
export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
}

/** Metadados de paginação para listas. */
export interface ApiMeta {
  page: number;
  perPage: number;
  total: number;
}

/** Envelope de erro da API: `{ error, code, details? }`. */
export interface ApiError {
  error: string;
  code: string;
  details?: unknown;
}
