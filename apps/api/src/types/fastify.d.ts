import 'fastify';
import type pg from 'pg';
import type { TenantDatabase } from '@lojao/db';

import type { Session } from '../plugins/session.js';

declare module 'fastify' {
  interface FastifyContextConfig {
    rawBody?: boolean;
  }

  interface FastifyRequest {
    /** Sessão compartilhada com o legacy (cookie `lojao.sid`). */
    session: Session;
    /** Slug do tenant resolvido (injetado pelo `tenantPreHandler`). */
    tenantSlug?: string;
    /** ID do tenant resolvido. */
    tenantId?: number;
    /** Pool do banco do tenant (injetado em rotas com tenant resolvido). */
    db: pg.Pool;
    /** Drizzle ORM do tenant (Fase 7+). */
    drizzle: TenantDatabase;
  }
}
