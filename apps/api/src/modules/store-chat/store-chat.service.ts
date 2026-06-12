import type pg from 'pg';

const BOT_DELAY_MS =
  process.env.NODE_ENV === 'test' ? 0 : parseInt(process.env.BOT_RESPONSE_DELAY_MS ?? '900', 10);

export async function findBotResponse(db: pg.Pool, mensagem: string): Promise<string | null> {
  const r = await db.query(
    `SELECT * FROM bot_respostas WHERE ativo = true ORDER BY ordem ASC, id ASC`,
  );
  const lower = mensagem.toLowerCase();
  for (const row of r.rows as Array<{ palavra_chave: string; resposta: string }>) {
    const keywords = row.palavra_chave
      .toLowerCase()
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    if (keywords.some((k) => lower.includes(k))) {
      return row.resposta;
    }
  }
  return null;
}

export async function sendStoreMessage(
  db: pg.Pool,
  opts: {
    sessionId: string;
    usuarioId?: number | null;
    nome?: string;
    conversaId?: number;
    conteudo: string;
  },
): Promise<{
  conversa_id: number;
  mensagem: Record<string, unknown>;
  bot_mensagem?: Record<string, unknown>;
}> {
  const conteudo = opts.conteudo.trim().slice(0, 2000);
  if (!conteudo) throw new Error('Mensagem vazia');

  let conversaId = opts.conversaId;

  if (!conversaId) {
    const existing = await db.query(
      `SELECT id FROM conversas WHERE session_id = $1 AND status = 'aberta' ORDER BY created_at DESC LIMIT 1`,
      [opts.sessionId],
    );
    if (existing.rows[0]) {
      conversaId = Number(existing.rows[0].id);
    } else {
      const nr = await db.query(
        `INSERT INTO conversas (session_id, nome_visitante, usuario_id) VALUES ($1, $2, $3) RETURNING id`,
        [opts.sessionId, (opts.nome || 'Visitante').slice(0, 100), opts.usuarioId ?? null],
      );
      conversaId = Number(nr.rows[0]!.id);
    }
  }

  const mr = await db.query(
    `INSERT INTO mensagens (conversa_id, remetente, conteudo) VALUES ($1, 'cliente', $2) RETURNING *`,
    [conversaId, conteudo],
  );
  await db.query(`UPDATE conversas SET updated_at = NOW() WHERE id = $1`, [conversaId]);

  const convR = await db.query(`SELECT bot_ativo FROM conversas WHERE id = $1`, [conversaId]);
  let botMensagem: Record<string, unknown> | undefined;

  if (convR.rows[0]?.bot_ativo) {
    const resposta = await findBotResponse(db, conteudo);
    if (resposta) {
      if (BOT_DELAY_MS > 0) {
        await new Promise((resolve) => setTimeout(resolve, BOT_DELAY_MS));
      }
      const br = await db.query(
        `INSERT INTO mensagens (conversa_id, remetente, conteudo) VALUES ($1, 'bot', $2) RETURNING *`,
        [conversaId, resposta],
      );
      botMensagem = br.rows[0] as Record<string, unknown>;
    }
  }

  return {
    conversa_id: conversaId,
    mensagem: mr.rows[0] as Record<string, unknown>,
    bot_mensagem: botMensagem,
  };
}
