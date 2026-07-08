import type { StoreScope } from '../../lib/store-scope.js';

export async function findBotKeywords(
  { pool, storeId }: Pick<StoreScope, 'pool' | 'storeId'>,
): Promise<Array<{ keyword: string; reply: string }>> {
  const r = await pool.query(
    `SELECT keyword, reply FROM chat_bot_replies
     WHERE store_id = $1 AND active = true ORDER BY "order" ASC, id ASC`,
    [storeId],
  );
  return r.rows as Array<{ keyword: string; reply: string }>;
}

export async function findOrCreateConversation(
  { pool, storeId }: StoreScope,
  sessionId: string,
  visitorName: string,
  usuarioId?: number | null,
): Promise<number> {
  const existing = await pool.query(
    `SELECT id FROM chat_conversations
     WHERE store_id = $1 AND session_id = $2 AND status = 'open'
     ORDER BY created_at DESC LIMIT 1`,
    [storeId, sessionId],
  );
  if (existing.rows[0]) {
    return Number(existing.rows[0].id);
  }

  const nr = await pool.query(
    `INSERT INTO chat_conversations (store_id, session_id, visitor_name, buyer_id)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [storeId, sessionId, visitorName.slice(0, 100), usuarioId ?? null],
  );
  return Number(nr.rows[0]!.id);
}

export async function insertMessage(
  { pool, storeId }: StoreScope,
  conversaId: number,
  sender: string,
  conteudo: string,
): Promise<Record<string, unknown>> {
  const r = await pool.query(
    `INSERT INTO chat_messages (store_id, conversation_id, sender, content)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [storeId, conversaId, sender, conteudo],
  );
  return r.rows[0] as Record<string, unknown>;
}

export async function touchConversation(
  { pool, storeId }: StoreScope,
  conversaId: number,
): Promise<void> {
  await pool.query(
    `UPDATE chat_conversations SET updated_at = NOW() WHERE id = $1 AND store_id = $2`,
    [conversaId, storeId],
  );
}

export async function findConversationBotActive(
  { pool, storeId }: StoreScope,
  conversaId: number,
): Promise<boolean> {
  const r = await pool.query(
    `SELECT bot_active FROM chat_conversations WHERE id = $1 AND store_id = $2`,
    [conversaId, storeId],
  );
  return Boolean(r.rows[0]?.bot_active);
}
