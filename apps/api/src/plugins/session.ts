import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type pg from 'pg';

import { masterPool } from '../lib/master-db.js';
import { generateSid, signSid, unsignSid } from '../lib/session-signature.js';

const COOKIE_NAME = 'lojao.sid';
const MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8h — igual ao legacy

/** Campos de sessão compartilhados com o legacy (`req.session`). */
export interface SessionFields {
  usuarioId?: number | null;
  nome?: string | null;
  email?: string | null;
  role?: 'admin' | 'usuario' | null;
  tenantSlug?: string;
  tenant_id?: number;
  redirecionarPara?: string | null;
  info?: string | null;
}

export interface Session extends SessionFields {
  /** Persiste a sessão e emite o cookie `lojao.sid`. */
  save(): Promise<void>;
  /** Remove a sessão do store e limpa o cookie. */
  destroy(): Promise<void>;
  /** Regenera o sid (anti session fixation) descartando os dados atuais. */
  regenerate(): Promise<void>;
}

/** Metadados do cookie gravados em `sess.cookie` (formato connect-pg-simple). */
interface CookieMeta {
  originalMaxAge: number;
  expires: string;
  secure: boolean;
  httpOnly: boolean;
  path: string;
  sameSite: 'lax' | 'none';
}

const DATA_KEYS: (keyof SessionFields)[] = [
  'usuarioId',
  'nome',
  'email',
  'role',
  'tenantSlug',
  'tenant_id',
  'redirecionarPara',
  'info',
];

function sessionSecret(): string {
  return process.env.SESSION_SECRET ?? 'fallback-secret-troque-em-producao';
}

/** Em dev local, cookie compartilhado entre :3000/:3001/:3002 via domain `localhost`. */
function sharedCookieDomain(): string | undefined {
  return process.env.NODE_ENV !== 'production' ? 'localhost' : undefined;
}

/** Cross-origin admin (Render static) exige `none` + `secure` em produção. */
function cookieSameSite(): 'lax' | 'none' {
  if (process.env.NODE_ENV !== 'production') return 'lax';
  return process.env.COOKIE_SAME_SITE === 'lax' ? 'lax' : 'none';
}

function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(COOKIE_NAME, { path: '/' });
  const domain = sharedCookieDomain();
  if (domain) {
    reply.clearCookie(COOKIE_NAME, { path: '/', domain });
  }
}

function buildCookieMeta(): CookieMeta {
  return {
    originalMaxAge: MAX_AGE_MS,
    expires: new Date(Date.now() + MAX_AGE_MS).toISOString(),
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    path: '/',
    sameSite: cookieSameSite(),
  };
}

/** Extrai apenas os campos de dados (sem métodos) para serialização/diff. */
function extractData(session: Session): SessionFields {
  const data: Record<string, unknown> = {};
  for (const key of DATA_KEYS) {
    const value = session[key];
    if (value !== undefined && value !== null) data[key] = value;
  }
  return data as SessionFields;
}

class PgSessionStore {
  constructor(private readonly pool: pg.Pool) {}

  async get(sid: string): Promise<Record<string, unknown> | null> {
    const result = await this.pool.query(
      'SELECT sess FROM sessao WHERE sid = $1 AND expire > NOW()',
      [sid],
    );
    const row = result.rows[0] as { sess: unknown } | undefined;
    if (!row) return null;
    return typeof row.sess === 'string'
      ? (JSON.parse(row.sess) as Record<string, unknown>)
      : (row.sess as Record<string, unknown>);
  }

  async set(sid: string, sess: Record<string, unknown>, expire: Date): Promise<void> {
    await this.pool.query(
      `INSERT INTO sessao (sid, sess, expire) VALUES ($1, $2, $3)
       ON CONFLICT (sid) DO UPDATE SET sess = EXCLUDED.sess, expire = EXCLUDED.expire`,
      [sid, JSON.stringify(sess), expire],
    );
  }

  async destroy(sid: string): Promise<void> {
    await this.pool.query('DELETE FROM sessao WHERE sid = $1', [sid]);
  }
}

interface SessionState {
  sid: string;
  isNew: boolean;
  destroyed: boolean;
  /** Snapshot serializado dos dados no load (para diff em onSend). */
  original: string;
}

const states = new WeakMap<FastifyRequest, SessionState>();

async function persist(
  store: PgSessionStore,
  reply: FastifyReply,
  session: Session,
  state: SessionState,
): Promise<void> {
  const cookie = buildCookieMeta();
  const data = extractData(session);
  const sess: Record<string, unknown> = { cookie, ...data };

  await store.set(state.sid, sess, new Date(cookie.expires));
  state.original = JSON.stringify(data);
  state.isNew = false;

  reply.setCookie(COOKIE_NAME, signSid(state.sid, sessionSecret()), {
    path: '/',
    domain: sharedCookieDomain(),
    httpOnly: true,
    sameSite: cookieSameSite(),
    secure: process.env.NODE_ENV === 'production',
    maxAge: Math.floor(MAX_AGE_MS / 1000),
    expires: new Date(cookie.expires),
  });
}

function attachMethods(
  store: PgSessionStore,
  reply: FastifyReply,
  session: Session,
  state: SessionState,
): void {
  const data = session as unknown as Record<string, unknown>;
  Object.defineProperties(session, {
    save: {
      enumerable: false,
      value: async (): Promise<void> => {
        await persist(store, reply, session, state);
      },
    },
    destroy: {
      enumerable: false,
      value: async (): Promise<void> => {
        if (!state.isNew) await store.destroy(state.sid);
        for (const key of DATA_KEYS) delete data[key];
        state.destroyed = true;
        state.original = '{}';
        clearSessionCookie(reply);
      },
    },
    regenerate: {
      enumerable: false,
      value: async (): Promise<void> => {
        if (!state.isNew) await store.destroy(state.sid);
        for (const key of DATA_KEYS) delete data[key];
        state.sid = generateSid();
        state.isNew = true;
        state.destroyed = false;
        state.original = '{}';
      },
    },
  });
}

/**
 * Plugin de sessão compatível com `express-session` + `connect-pg-simple`.
 *
 * Em vez de `@fastify/session` (incompatível na assinatura/serialização com o
 * Express), reproduzimos exatamente o formato do legacy: cookie `lojao.sid`
 * assinado com `s:`/HMAC-SHA256 e store na tabela `sessao` do banco master.
 * Isso garante o compartilhamento de sessão exigido pelo DoD da Fase 1.
 */
export const sessionPlugin = fp(
  function sessionPlugin(app: FastifyInstance, _opts: unknown, done: (err?: Error) => void): void {
    const store = new PgSessionStore(masterPool);
    const secret = sessionSecret();

    app.decorateRequest('session', null as unknown as Session);

    app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
      const raw = request.cookies?.[COOKIE_NAME];
      let sid: string | null = null;
      let loaded: Record<string, unknown> | null = null;

      if (raw) {
        const unsigned = unsignSid(raw, secret);
        if (unsigned) {
          loaded = await store.get(unsigned);
          if (loaded) sid = unsigned;
        }
      }

      const isNew = sid === null;
      if (!sid) sid = generateSid();

      const session = {} as Session;
      if (loaded) {
        const target = session as unknown as Record<string, unknown>;
        for (const key of DATA_KEYS) {
          if (loaded[key] !== undefined) {
            target[key] = loaded[key];
          }
        }
      }

      const state: SessionState = {
        sid,
        isNew,
        destroyed: false,
        original: JSON.stringify(extractData(session)),
      };
      states.set(request, state);
      attachMethods(store, reply, session, state);
      request.session = session;
    });

    // Auto-persiste sessões modificadas implicitamente (sem chamar save()).
    app.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply, payload) => {
      const state = states.get(request);
      const session = request.session;
      if (!state || !session || state.destroyed) return payload;

      const current = JSON.stringify(extractData(session));
      if (current !== state.original && current !== '{}') {
        await persist(store, reply, session, state);
      }
      return payload;
    });

    done();
  },
  { name: 'session', fastify: '5.x' },
);
