import type { StoreScope } from '../../lib/store-scope.js';

const BOT_DELAY_MS =
  process.env.NODE_ENV === 'test' ? 0 : parseInt(process.env.BOT_RESPONSE_DELAY_MS ?? '900', 10);

export async function findBotResponse(
  { pool, storeId }: Pick<StoreScope, 'pool' | 'storeId'>,
  mensagem: string,
): Promise<string | null> {
  const r = await pool.query(
    `SELECT keyword, reply FROM chat_bot_replies
     WHERE store_id = $1 AND active = true ORDER BY "order" ASC, id ASC`,
    [storeId],
  );
  const lower = mensagem.toLowerCase();
  for (const row of r.rows as Array<{ keyword: string; reply: string }>) {
    const keywords = row.keyword
      .toLowerCase()
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    if (keywords.some((k) => lower.includes(k))) {
      return row.reply;
    }
  }
  return null;
}

export async function sendStoreMessage(
  scope: StoreScope,
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
  const { pool, storeId } = scope;
  const conteudo = opts.conteudo.trim().slice(0, 2000);
  if (!conteudo) throw new Error('Mensagem vazia');

  let conversaId = opts.conversaId;

  if (!conversaId) {
    const existing = await pool.query(
      `SELECT id FROM chat_conversations
       WHERE store_id = $1 AND session_id = $2 AND status = 'open'
       ORDER BY created_at DESC LIMIT 1`,
      [storeId, opts.sessionId],
    );
    if (existing.rows[0]) {
      conversaId = Number(existing.rows[0].id);
    } else {
      const nr = await pool.query(
        `INSERT INTO chat_conversations (store_id, session_id, visitor_name, buyer_id)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [storeId, opts.sessionId, (opts.nome || 'Visitante').slice(0, 100), opts.usuarioId ?? null],
      );
      conversaId = Number(nr.rows[0]!.id);
    }
  }

  const mr = await pool.query(
    `INSERT INTO chat_messages (store_id, conversation_id, sender, content)
     VALUES ($1, $2, 'customer', $3) RETURNING *`,
    [storeId, conversaId, conteudo],
  );
  await pool.query(
    `UPDATE chat_conversations SET updated_at = NOW() WHERE id = $1 AND store_id = $2`,
    [conversaId, storeId],
  );

  const convR = await pool.query(
    `SELECT bot_active FROM chat_conversations WHERE id = $1 AND store_id = $2`,
    [conversaId, storeId],
  );
  let botMensagem: Record<string, unknown> | undefined;

  if (convR.rows[0]?.bot_active) {
    const resposta = await findBotResponse(scope, conteudo);
    if (resposta) {
      if (BOT_DELAY_MS > 0) {
        await new Promise((resolve) => setTimeout(resolve, BOT_DELAY_MS));
      }
      const br = await pool.query(
        `INSERT INTO chat_messages (store_id, conversation_id, sender, content)
         VALUES ($1, $2, 'bot', $3) RETURNING *`,
        [storeId, conversaId, resposta],
      );
      botMensagem = mapMensagemToApi(br.rows[0] as Record<string, unknown>);
    }
  }

  return {
    conversa_id: conversaId,
    mensagem: mapMensagemToApi(mr.rows[0] as Record<string, unknown>),
    bot_mensagem: botMensagem,
  };
}

function mapMensagemToApi(row: Record<string, unknown>): Record<string, unknown> {
  const sender = String(row.sender ?? '');
  const remetente =
    sender === 'customer' ? 'cliente' : sender === 'admin' ? 'admin' : sender;
  return {
    id: row.id,
    conversa_id: row.conversation_id,
    remetente,
    conteudo: row.content,
    lida: row.read,
    created_at: row.created_at,
  };
}
