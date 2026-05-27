const { Server } = require('socket.io');
const { getPool } = require('./tenantDb');

let io;

function resolveSlug(socket) {
  const req = socket.request;
  if (req.session?.tenantSlug) return req.session.tenantSlug;
  if (process.env.TENANT_SLUG) return process.env.TENANT_SLUG;
  if (socket.handshake.headers['x-tenant-slug']) return socket.handshake.headers['x-tenant-slug'];
  const host = (socket.handshake.headers.host || '').split(':')[0];
  const parts = host.split('.');
  const isIp = /^\d+\.\d+\.\d+\.\d+$/.test(host);
  if (!isIp && parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'localhost') return parts[0];
  return null;
}

async function botResponder(db, conversa_id, mensagem, tenantSlug) {
  try {
    const r = await db.query(
      `SELECT * FROM bot_respostas WHERE ativo = true ORDER BY ordem ASC, id ASC`
    );
    const lower = mensagem.toLowerCase();
    let resposta = null;
    for (const row of r.rows) {
      const keywords = row.palavra_chave.toLowerCase().split(',').map(k => k.trim()).filter(Boolean);
      if (keywords.some(k => lower.includes(k))) {
        resposta = row.resposta;
        break;
      }
    }
    if (!resposta) return;

    await new Promise(resolve => setTimeout(resolve, 900));

    const mr = await db.query(
      `INSERT INTO mensagens (conversa_id, remetente, conteudo) VALUES ($1, 'bot', $2) RETURNING *`,
      [conversa_id, resposta]
    );
    if (io) {
      io.to(`conv:${tenantSlug}:${conversa_id}`).emit('conversa:mensagem', mr.rows[0]);
      io.to(`admin:${tenantSlug}`).emit('admin:nova_mensagem', { conversa_id, mensagem: mr.rows[0] });
    }
  } catch (err) {
    console.error('[Bot] Erro ao responder:', err.message);
  }
}

function init(httpServer, sessionMiddleware) {
  io = new Server(httpServer);

  io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res || {}, next);
  });

  io.use(async (socket, next) => {
    try {
      const slug = resolveSlug(socket);
      if (!slug) return next(new Error('Tenant não identificado'));
      socket.tenantSlug = slug;
      socket.db = await getPool(slug);
      next();
    } catch {
      next(new Error('Tenant inválido'));
    }
  });

  io.on('connection', (socket) => {
    const { db, tenantSlug } = socket;
    const session = socket.request.session;

    socket.on('admin:entrar', () => {
      if (session?.role !== 'admin') return;
      socket.join(`admin:${tenantSlug}`);
    });

    socket.on('conversa:entrar', (conversa_id) => {
      if (session?.role !== 'admin') return;
      socket.join(`conv:${tenantSlug}:${conversa_id}`);
    });

    socket.on('conversa:iniciar', async (dados, cb) => {
      try {
        const sessionId = session?.id || socket.id;
        const nome = (dados?.nome || 'Visitante').slice(0, 100);

        let r = await db.query(
          `SELECT * FROM conversas WHERE session_id = $1 AND status = 'aberta' ORDER BY created_at DESC LIMIT 1`,
          [sessionId]
        );

        let conversa;
        if (r.rows.length > 0) {
          conversa = r.rows[0];
        } else {
          const nr = await db.query(
            `INSERT INTO conversas (session_id, nome_visitante, usuario_id) VALUES ($1, $2, $3) RETURNING *`,
            [sessionId, nome, session?.usuarioId || null]
          );
          conversa = nr.rows[0];
          io.to(`admin:${tenantSlug}`).emit('admin:nova_conversa', conversa);
        }

        socket.conversa_id = conversa.id;
        socket.join(`conv:${tenantSlug}:${conversa.id}`);

        const msgs = await db.query(
          `SELECT * FROM mensagens WHERE conversa_id = $1 ORDER BY created_at ASC`,
          [conversa.id]
        );

        if (cb) cb({ ok: true, conversa, mensagens: msgs.rows });
      } catch (err) {
        console.error('[Chat] conversa:iniciar', err.message);
        if (cb) cb({ ok: false });
      }
    });

    socket.on('conversa:mensagem', async (dados) => {
      try {
        const conversa_id = socket.conversa_id;
        if (!conversa_id) return;
        const conteudo = (dados?.conteudo || '').trim().slice(0, 2000);
        if (!conteudo) return;

        const mr = await db.query(
          `INSERT INTO mensagens (conversa_id, remetente, conteudo) VALUES ($1, 'cliente', $2) RETURNING *`,
          [conversa_id, conteudo]
        );
        const msg = mr.rows[0];

        await db.query(`UPDATE conversas SET updated_at = NOW() WHERE id = $1`, [conversa_id]);
        io.to(`conv:${tenantSlug}:${conversa_id}`).emit('conversa:mensagem', msg);
        io.to(`admin:${tenantSlug}`).emit('admin:nova_mensagem', { conversa_id, mensagem: msg });

        const convR = await db.query(`SELECT bot_ativo FROM conversas WHERE id = $1`, [conversa_id]);
        if (convR.rows[0]?.bot_ativo) {
          botResponder(db, conversa_id, conteudo, tenantSlug);
        }
      } catch (err) {
        console.error('[Chat] conversa:mensagem', err.message);
      }
    });

    socket.on('conversa:mensagem_admin', async (dados) => {
      if (session?.role !== 'admin') return;
      try {
        const { conversa_id, conteudo } = dados || {};
        const texto = (conteudo || '').trim().slice(0, 2000);
        if (!texto || !conversa_id) return;

        const mr = await db.query(
          `INSERT INTO mensagens (conversa_id, remetente, conteudo) VALUES ($1, 'admin', $2) RETURNING *`,
          [conversa_id, texto]
        );
        await db.query(`UPDATE conversas SET updated_at = NOW() WHERE id = $1`, [conversa_id]);
        io.to(`conv:${tenantSlug}:${conversa_id}`).emit('conversa:mensagem', mr.rows[0]);
        io.to(`admin:${tenantSlug}`).emit('admin:nova_mensagem', { conversa_id, mensagem: mr.rows[0] });
      } catch (err) {
        console.error('[Chat] conversa:mensagem_admin', err.message);
      }
    });

    socket.on('conversa:assumir', async (conversa_id) => {
      if (session?.role !== 'admin') return;
      try {
        await db.query(
          `UPDATE conversas SET bot_ativo = false, updated_at = NOW() WHERE id = $1`,
          [conversa_id]
        );
        io.to(`admin:${tenantSlug}`).emit('admin:conversa_atualizada', { conversa_id, bot_ativo: false });
      } catch (err) {
        console.error('[Chat] conversa:assumir', err.message);
      }
    });

    socket.on('conversa:liberar_bot', async (conversa_id) => {
      if (session?.role !== 'admin') return;
      try {
        await db.query(
          `UPDATE conversas SET bot_ativo = true, updated_at = NOW() WHERE id = $1`,
          [conversa_id]
        );
        io.to(`admin:${tenantSlug}`).emit('admin:conversa_atualizada', { conversa_id, bot_ativo: true });
      } catch (err) {
        console.error('[Chat] conversa:liberar_bot', err.message);
      }
    });

    socket.on('conversa:encerrar', async (conversa_id) => {
      if (session?.role !== 'admin') return;
      try {
        await db.query(
          `UPDATE conversas SET status = 'encerrada', updated_at = NOW() WHERE id = $1`,
          [conversa_id]
        );
        io.to(`conv:${tenantSlug}:${conversa_id}`).emit('conversa:encerrada');
        io.to(`admin:${tenantSlug}`).emit('admin:conversa_atualizada', { conversa_id, status: 'encerrada' });
      } catch (err) {
        console.error('[Chat] conversa:encerrar', err.message);
      }
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { init, getIO };
