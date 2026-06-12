import 'fastify';
import type pg from 'pg';

import type { Session } from '../plugins/session.js';

declare module 'fastify' {
  interface FastifyRequest {
    /** Sessão compartilhada com o legacy (cookie `lojao.sid`). */
    session: Session;
    /** Slug do tenant resolvido (injetado pelo `tenantPreHandler`). */
    tenantSlug?: string;
    /** ID do tenant resolvido. */
    tenantId?: number;
    /** Pool do banco do tenant (injetado em rotas com tenant resolvido). */
    db: pg.Pool;
  }
}
