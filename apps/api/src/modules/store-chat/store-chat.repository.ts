import type pg from 'pg';

export async function findActiveBotRespostas(
  db: pg.Pool,
): Promise<Array<{ palavra_chave: string; resposta: string }>> {
  const r = await db.query(
    `SELECT * FROM bot_respostas WHERE ativo = true ORDER BY ordem ASC, id ASC`,
  );
  return r.rows as Array<{ palavra_chave: string; resposta: string }>;
}

export async function findOpenConversaBySession(
  db: pg.Pool,
  sessionId: string,
): Promise<number | null> {
  const existing = await db.query(
    `SELECT id FROM conversas WHERE session_id = $1 AND status = 'aberta' ORDER BY created_at DESC LIMIT 1`,
    [sessionId],
  );
  if (!existing.rows[0]) return null;
  return Number(existing.rows[0].id);
}

export async function insertConversa(
  db: pg.Pool,
  sessionId: string,
  nomeVisitante: string,
  usuarioId: number | null,
): Promise<number> {
  const nr = await db.query(
    `INSERT INTO conversas (session_id, nome_visitante, usuario_id) VALUES ($1, $2, $3) RETURNING id`,
    [sessionId, nomeVisitante, usuarioId],
  );
  return Number(nr.rows[0]!.id);
}

export async function insertMensagem(
  db: pg.Pool,
  conversaId: number,
  remetente: 'cliente' | 'bot' | 'admin',
  conteudo: string,
): Promise<Record<string, unknown>> {
  const mr = await db.query(
    `INSERT INTO mensagens (conversa_id, remetente, conteudo) VALUES ($1, $2, $3) RETURNING *`,
    [conversaId, remetente, conteudo],
  );
  return mr.rows[0] as Record<string, unknown>;
}

export async function touchConversaUpdatedAt(db: pg.Pool, conversaId: number): Promise<void> {
  await db.query(`UPDATE conversas SET updated_at = NOW() WHERE id = $1`, [conversaId]);
}

export async function findConversaBotAtivo(db: pg.Pool, conversaId: number): Promise<boolean> {
  const convR = await db.query(`SELECT bot_ativo FROM conversas WHERE id = $1`, [conversaId]);
  return Boolean(convR.rows[0]?.bot_ativo);
}
