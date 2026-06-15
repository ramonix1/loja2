import type { FastifyInstance } from 'fastify';
import { Server as SocketIOServer, type ServerOptions } from 'socket.io';

import { getTenant } from '../lib/tenant-db.js';
import { findBotResponse } from '../modules/store-chat/store-chat.service.js';

let io: SocketIOServer | null = null;

const BOT_DELAY_MS =
  process.env.NODE_ENV === 'test' ? 0 : parseInt(process.env.BOT_RESPONSE_DELAY_MS ?? '900', 10);

async function botResponder(
  db: import('pg').Pool,
  conversa_id: number,
  mensagem: string,
  tenantSlug: string,
): Promise<void> {
  try {
    const resposta = await findBotResponse(db, mensagem);
    if (!resposta) return;

    if (BOT_DELAY_MS > 0) {
      await new Promise((resolve) => setTimeout(resolve, BOT_DELAY_MS));
    }

    const mr = await db.query(
      `INSERT INTO mensagens (conversa_id, remetente, conteudo) VALUES ($1, 'bot', $2) RETURNING *`,
      [conversa_id, resposta],
    );
    if (io) {
      io.to(`conv:${tenantSlug}:${conversa_id}`).emit('conversa:mensagem', mr.rows[0]);
      io.to(`admin:${tenantSlug}`).emit('admin:nova_mensagem', {
        conversa_id,
        mensagem: mr.rows[0],
      });
    }
  } catch (err) {
    console.error('[Bot] Erro ao responder:', err instanceof Error ? err.message : err);
  }
}

function resolveSocketSlug(socket: import('socket.io').Socket): string | null {
  const req = socket.request as unknown as { session?: { tenantSlug?: string } };
  if (req.session?.tenantSlug) return req.session.tenantSlug;
  if (process.env.TENANT_SLUG) return process.env.TENANT_SLUG;
  const header = socket.handshake.headers['x-tenant-slug'];
  if (typeof header === 'string' && header) return header;
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

/** Porta `apps/legacy/config/socketio.js` para Fastify. */
export async function registerSocketIO(app: FastifyInstance): Promise<void> {
  if (process.env.DISABLE_SOCKET_IO === 'true') return;

  await app.ready();

  const corsOrigins: ServerOptions['cors'] = {
    origin: [
      (process.env.ADMIN_URL || 'http://localhost:5173').replace(/\/$/, ''),
      (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, ''),
      /^https?:\/\/localhost(:\d+)?$/,
    ],
    credentials: true,
  };

  io = new SocketIOServer(app.server, { cors: corsOrigins });

  io.use(async (socket, next) => {
    try {
      const slug = resolveSocketSlug(socket);
      if (!slug) return next(new Error('Tenant não identificado'));
      socket.data.tenantSlug = slug;
      const { pool } = await getTenant(slug);
      socket.data.db = pool;
      next();
    } catch {
      next(new Error('Tenant inválido'));
    }
  });

  io.on('connection', (socket) => {
    const db = socket.data.db as import('pg').Pool;
    const tenantSlug = socket.data.tenantSlug as string;
    const req = socket.request as unknown as {
      session?: { role?: string; usuarioId?: number; nome?: string };
    };
    const session = req.session;

    socket.on('admin:entrar', () => {
      if (session?.role !== 'admin') return;
      socket.join(`admin:${tenantSlug}`);
    });

    socket.on('conversa:entrar', (conversa_id: number) => {
      if (session?.role !== 'admin') return;
      socket.join(`conv:${tenantSlug}:${conversa_id}`);
    });

    socket.on('conversa:iniciar', async (dados: { nome?: string }, cb) => {
      try {
        const sessionId = socket.id;
        const nome = (dados?.nome || 'Visitante').slice(0, 100);

        let r = await db.query(
          `SELECT * FROM conversas WHERE session_id = $1 AND status = 'aberta' ORDER BY created_at DESC LIMIT 1`,
          [sessionId],
        );

        let conversa;
        if (r.rows.length > 0) {
          conversa = r.rows[0];
        } else {
          const nr = await db.query(
            `INSERT INTO conversas (session_id, nome_visitante, usuario_id) VALUES ($1, $2, $3) RETURNING *`,
            [sessionId, nome, session?.usuarioId ?? null],
          );
          conversa = nr.rows[0];
          io?.to(`admin:${tenantSlug}`).emit('admin:nova_conversa', conversa);
        }

        socket.data.conversa_id = (conversa as { id: number }).id;
        socket.join(`conv:${tenantSlug}:${(conversa as { id: number }).id}`);

        const msgs = await db.query(
          `SELECT * FROM mensagens WHERE conversa_id = $1 ORDER BY created_at ASC`,
          [(conversa as { id: number }).id],
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
          `INSERT INTO mensagens (conversa_id, remetente, conteudo) VALUES ($1, 'cliente', $2) RETURNING *`,
          [conversa_id, conteudo],
        );
        const msg = mr.rows[0];

        await db.query(`UPDATE conversas SET updated_at = NOW() WHERE id = $1`, [conversa_id]);
        io?.to(`conv:${tenantSlug}:${conversa_id}`).emit('conversa:mensagem', msg);
        io?.to(`admin:${tenantSlug}`).emit('admin:nova_mensagem', { conversa_id, mensagem: msg });

        const convR = await db.query(`SELECT bot_ativo FROM conversas WHERE id = $1`, [conversa_id]);
        if (convR.rows[0]?.bot_ativo) {
          void botResponder(db, conversa_id, conteudo, tenantSlug);
        }
      } catch (err) {
        console.error('[Chat] conversa:mensagem', err instanceof Error ? err.message : err);
      }
    });

    socket.on('conversa:mensagem_admin', async (dados: { conversa_id?: number; conteudo?: string }) => {
      if (session?.role !== 'admin') return;
      try {
        const { conversa_id, conteudo } = dados || {};
        const texto = (conteudo || '').trim().slice(0, 2000);
        if (!texto || !conversa_id) return;

        const mr = await db.query(
          `INSERT INTO mensagens (conversa_id, remetente, conteudo) VALUES ($1, 'admin', $2) RETURNING *`,
          [conversa_id, texto],
        );
        await db.query(`UPDATE conversas SET updated_at = NOW() WHERE id = $1`, [conversa_id]);
        io?.to(`conv:${tenantSlug}:${conversa_id}`).emit('conversa:mensagem', mr.rows[0]);
        io?.to(`admin:${tenantSlug}`).emit('admin:nova_mensagem', {
          conversa_id,
          mensagem: mr.rows[0],
        });
      } catch (err) {
        console.error('[Chat] conversa:mensagem_admin', err instanceof Error ? err.message : err);
      }
    });

    socket.on('conversa:assumir', async (conversa_id: number) => {
      if (session?.role !== 'admin') return;
      try {
        await db.query(`UPDATE conversas SET bot_ativo = false, updated_at = NOW() WHERE id = $1`, [
          conversa_id,
        ]);
        io?.to(`admin:${tenantSlug}`).emit('admin:conversa_atualizada', {
          conversa_id,
          bot_ativo: false,
        });
      } catch (err) {
        console.error('[Chat] conversa:assumir', err instanceof Error ? err.message : err);
      }
    });

    socket.on('conversa:liberar_bot', async (conversa_id: number) => {
      if (session?.role !== 'admin') return;
      try {
        await db.query(`UPDATE conversas SET bot_ativo = true, updated_at = NOW() WHERE id = $1`, [
          conversa_id,
        ]);
        io?.to(`admin:${tenantSlug}`).emit('admin:conversa_atualizada', {
          conversa_id,
          bot_ativo: true,
        });
      } catch (err) {
        console.error('[Chat] conversa:liberar_bot', err instanceof Error ? err.message : err);
      }
    });

    socket.on('conversa:encerrar', async (conversa_id: number) => {
      if (session?.role !== 'admin') return;
      try {
        await db.query(`UPDATE conversas SET status = 'encerrada', updated_at = NOW() WHERE id = $1`, [
          conversa_id,
        ]);
        io?.to(`conv:${tenantSlug}:${conversa_id}`).emit('conversa:encerrada');
        io?.to(`admin:${tenantSlug}`).emit('admin:conversa_atualizada', {
          conversa_id,
          status: 'encerrada',
        });
      } catch (err) {
        console.error('[Chat] conversa:encerrar', err instanceof Error ? err.message : err);
      }
    });
  });
}
