import type { FastifyInstance } from 'fastify';
import { Server as SocketIOServer, type ServerOptions } from 'socket.io';

import { getStoreBySlug, StoreNotFoundError } from '../lib/merchant-db.js';
import { isOriginAllowed } from '../lib/cors-config.js';
import { findBotResponse } from '../modules/store-chat/store-chat.service.js';

let io: SocketIOServer | null = null;

const BOT_DELAY_MS =
  process.env.NODE_ENV === 'test' ? 0 : parseInt(process.env.BOT_RESPONSE_DELAY_MS ?? '900', 10);

async function botResponder(
  pool: import('pg').Pool,
  storeId: number,
  conversationId: number,
  mensagem: string,
  storeSlug: string,
): Promise<void> {
  try {
    const resposta = await findBotResponse({ pool, storeId }, mensagem);
    if (!resposta) return;

    if (BOT_DELAY_MS > 0) {
      await new Promise((resolve) => setTimeout(resolve, BOT_DELAY_MS));
    }

    const mr = await pool.query(
      `INSERT INTO chat_messages (store_id, conversation_id, sender, content)
       VALUES ($1, $2, 'bot', $3) RETURNING *`,
      [storeId, conversationId, resposta],
    );
    if (io) {
      io.to(`conv:${storeSlug}:${conversationId}`).emit('conversa:mensagem', mr.rows[0]);
      io.to(`admin:${storeSlug}`).emit('admin:nova_mensagem', {
        conversa_id: conversationId,
        mensagem: mr.rows[0],
      });
    }
  } catch (err) {
    console.error('[Bot] Erro ao responder:', err instanceof Error ? err.message : err);
  }
}

function resolveSocketStoreSlug(socket: import('socket.io').Socket): string | null {
  const req = socket.request as unknown as { session?: { storeSlug?: string } };
  if (req.session?.storeSlug) return req.session.storeSlug;

  const header = socket.handshake.headers['x-store-slug'];
  if (typeof header === 'string' && header.trim()) return header.trim();

  if (process.env.STORE_SLUG?.trim()) return process.env.STORE_SLUG.trim();

  const host = (socket.handshake.headers.host || '').split(':')[0] ?? '';
  const parts = host.split('.');
  const isIp = /^\d+\.\d+\.\d+\.\d+$/.test(host);
  if (!isIp && parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'localhost') {
    return parts[0] ?? null;
  }
  return null;
}

export function getIO(): SocketIOServer | null {
  return io;
}

/** Porta `apps/legacy/config/socketio.js` para Fastify (schema EN + merchant DB). */
export async function registerSocketIO(app: FastifyInstance): Promise<void> {
  if (process.env.DISABLE_SOCKET_IO === 'true') return;

  await app.ready();

  const corsOrigins: ServerOptions['cors'] = {
    origin: (origin, callback) => {
      callback(null, isOriginAllowed(origin));
    },
    credentials: true,
  };

  io = new SocketIOServer(app.server, { cors: corsOrigins });

  io.use(async (socket, next) => {
    try {
      const slug = resolveSocketStoreSlug(socket);
      if (!slug) return next(new Error('Loja não identificada'));
      const ctx = await getStoreBySlug(slug);
      socket.data.storeSlug = slug;
      socket.data.storeId = ctx.store.id;
      socket.data.db = ctx.pool;
      next();
    } catch (err) {
      if (err instanceof StoreNotFoundError) {
        return next(new Error('Loja inválida'));
      }
      next(err instanceof Error ? err : new Error('Loja inválida'));
    }
  });

  io.on('connection', (socket) => {
    const db = socket.data.db as import('pg').Pool;
    const storeSlug = socket.data.storeSlug as string;
    const storeId = socket.data.storeId as number;
    const req = socket.request as unknown as {
      session?: { role?: string; usuarioId?: number; storeId?: number };
    };
    const session = req.session;

    socket.on('admin:entrar', () => {
      if (!session?.role || !['owner', 'admin', 'operator'].includes(session.role)) return;
      socket.join(`admin:${storeSlug}`);
    });

    socket.on('conversa:entrar', (conversa_id: number) => {
      if (!session?.role || !['owner', 'admin', 'operator'].includes(session.role)) return;
      socket.join(`conv:${storeSlug}:${conversa_id}`);
    });

    socket.on('conversa:iniciar', async (dados: { nome?: string }, cb) => {
      try {
        const sessionId = socket.id;
        const nome = (dados?.nome || 'Visitante').slice(0, 100);

        let r = await db.query(
          `SELECT * FROM chat_conversations
           WHERE store_id = $1 AND session_id = $2 AND status = 'open'
           ORDER BY created_at DESC LIMIT 1`,
          [storeId, sessionId],
        );

        let conversa;
        if (r.rows.length > 0) {
          conversa = r.rows[0];
        } else {
          const nr = await db.query(
            `INSERT INTO chat_conversations (store_id, session_id, visitor_name, buyer_id)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [storeId, sessionId, nome, session?.usuarioId ?? null],
          );
          conversa = nr.rows[0];
          io?.to(`admin:${storeSlug}`).emit('admin:nova_conversa', conversa);
        }

        const conversaId = (conversa as { id: number }).id;
        socket.data.conversa_id = conversaId;
        socket.join(`conv:${storeSlug}:${conversaId}`);

        const msgs = await db.query(
          `SELECT * FROM chat_messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
          [conversaId],
        );

        if (cb) cb({ ok: true, conversa, mensagens: msgs.rows });
      } catch (err) {
        console.error('[Chat] conversa:iniciar', err instanceof Error ? err.message : err);
        if (cb) cb({ ok: false });
      }
    });

    socket.on('conversa:mensagem', async (dados: { conteudo?: string }) => {
      try {
        const conversa_id = socket.data.conversa_id as number | undefined;
        if (!conversa_id) return;
        const conteudo = (dados?.conteudo || '').trim().slice(0, 2000);
        if (!conteudo) return;

        const mr = await db.query(
          `INSERT INTO chat_messages (store_id, conversation_id, sender, content)
           VALUES ($1, $2, 'cliente', $3) RETURNING *`,
          [storeId, conversa_id, conteudo],
        );
        const msg = mr.rows[0];

        await db.query(`UPDATE chat_conversations SET updated_at = NOW() WHERE id = $1`, [
          conversa_id,
        ]);
        io?.to(`conv:${storeSlug}:${conversa_id}`).emit('conversa:mensagem', msg);
        io?.to(`admin:${storeSlug}`).emit('admin:nova_mensagem', { conversa_id, mensagem: msg });

        const convR = await db.query(`SELECT bot_active FROM chat_conversations WHERE id = $1`, [
          conversa_id,
        ]);
        if (convR.rows[0]?.bot_active) {
          void botResponder(db, storeId, conversa_id, conteudo, storeSlug);
        }
      } catch (err) {
        console.error('[Chat] conversa:mensagem', err instanceof Error ? err.message : err);
      }
    });

    socket.on('conversa:mensagem_admin', async (dados: { conversa_id?: number; conteudo?: string }) => {
      if (!session?.role || !['owner', 'admin', 'operator'].includes(session.role)) return;
      try {
        const { conversa_id, conteudo } = dados || {};
        const texto = (conteudo || '').trim().slice(0, 2000);
        if (!texto || !conversa_id) return;

        const mr = await db.query(
          `INSERT INTO chat_messages (store_id, conversation_id, sender, content)
           VALUES ($1, $2, 'admin', $3) RETURNING *`,
          [storeId, conversa_id, texto],
        );
        await db.query(`UPDATE chat_conversations SET updated_at = NOW() WHERE id = $1`, [
          conversa_id,
        ]);
        io?.to(`conv:${storeSlug}:${conversa_id}`).emit('conversa:mensagem', mr.rows[0]);
        io?.to(`admin:${storeSlug}`).emit('admin:nova_mensagem', {
          conversa_id,
          mensagem: mr.rows[0],
        });
      } catch (err) {
        console.error('[Chat] conversa:mensagem_admin', err instanceof Error ? err.message : err);
      }
    });

    socket.on('conversa:assumir', async (conversa_id: number) => {
      if (!session?.role || !['owner', 'admin', 'operator'].includes(session.role)) return;
      try {
        await db.query(`UPDATE chat_conversations SET bot_active = false, updated_at = NOW() WHERE id = $1`, [
          conversa_id,
        ]);
        io?.to(`admin:${storeSlug}`).emit('admin:conversa_atualizada', {
          conversa_id,
          bot_ativo: false,
        });
      } catch (err) {
        console.error('[Chat] conversa:assumir', err instanceof Error ? err.message : err);
      }
    });

    socket.on('conversa:liberar_bot', async (conversa_id: number) => {
      if (!session?.role || !['owner', 'admin', 'operator'].includes(session.role)) return;
      try {
        await db.query(`UPDATE chat_conversations SET bot_active = true, updated_at = NOW() WHERE id = $1`, [
          conversa_id,
        ]);
        io?.to(`admin:${storeSlug}`).emit('admin:conversa_atualizada', {
          conversa_id,
          bot_ativo: true,
        });
      } catch (err) {
        console.error('[Chat] conversa:liberar_bot', err instanceof Error ? err.message : err);
      }
    });

    socket.on('conversa:encerrar', async (conversa_id: number) => {
      if (!session?.role || !['owner', 'admin', 'operator'].includes(session.role)) return;
      try {
        await db.query(
          `UPDATE chat_conversations SET status = 'closed', updated_at = NOW() WHERE id = $1`,
          [conversa_id],
        );
        io?.to(`conv:${storeSlug}:${conversa_id}`).emit('conversa:encerrada');
        io?.to(`admin:${storeSlug}`).emit('admin:conversa_atualizada', {
          conversa_id,
          status: 'encerrada',
        });
      } catch (err) {
        console.error('[Chat] conversa:encerrar', err instanceof Error ? err.message : err);
      }
    });
  });
}
