import type {
  BotResposta,
  ChatConversa,
  ChatMensagem,
  CreateBotRespostaInput,
  UpdateBotRespostaInput,
} from '@lojao/types/chat';

import { chatStatusToApi } from '../../lib/merchant-schema-map.js';
import type { StoreScope } from '../../lib/store-scope.js';

function mapConversa(row: Record<string, unknown>): ChatConversa {
  return {
    id: Number(row.id),
    session_id: String(row.session_id),
    usuario_id: row.buyer_id === null ? null : Number(row.buyer_id),
    nome_visitante: String(row.visitor_name),
    status: chatStatusToApi(String(row.status)) as ChatConversa['status'],
    bot_ativo: Boolean(row.bot_active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    nao_lidas: Number(row.nao_lidas ?? 0),
  };
}

function mapMensagem(row: Record<string, unknown>): ChatMensagem {
  return {
    id: Number(row.id),
    conversa_id: Number(row.conversation_id),
    remetente: row.sender as ChatMensagem['remetente'],
    conteudo: String(row.content),
    lida: Boolean(row.read),
    created_at: String(row.created_at),
  };
}

function mapBotResposta(row: Record<string, unknown>): BotResposta {
  return {
    id: Number(row.id),
    palavra_chave: String(row.keyword),
    resposta: String(row.reply),
    ordem: Number(row.order ?? 0),
    ativo: Boolean(row.active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function findConversas({ pool, storeId }: StoreScope): Promise<ChatConversa[]> {
  const r = await pool.query(
    `SELECT c.*,
       (SELECT COUNT(*)::int FROM chat_messages m
        WHERE m.conversation_id = c.id AND m.store_id = c.store_id
          AND m.read = false AND m.sender = 'cliente') AS nao_lidas
     FROM chat_conversations c
     WHERE c.store_id = $1
     ORDER BY c.updated_at DESC LIMIT 200`,
    [storeId],
  );
  return r.rows.map(mapConversa);
}

export async function existsConversa(
  { pool, storeId }: StoreScope,
  conversaId: number,
): Promise<boolean> {
  const r = await pool.query(
    'SELECT id FROM chat_conversations WHERE id = $1 AND store_id = $2',
    [conversaId, storeId],
  );
  return !!r.rows[0];
}

export async function markMessagesRead(
  { pool, storeId }: StoreScope,
  conversaId: number,
): Promise<void> {
  await pool.query(
    `UPDATE chat_messages SET read = true
     WHERE conversation_id = $1 AND store_id = $2 AND sender = 'cliente'`,
    [conversaId, storeId],
  );
}

export async function findMensagensConversa(
  { pool, storeId }: StoreScope,
  conversaId: number,
): Promise<ChatMensagem[]> {
  const r = await pool.query(
    `SELECT * FROM chat_messages WHERE conversation_id = $1 AND store_id = $2 ORDER BY created_at ASC`,
    [conversaId, storeId],
  );
  return r.rows.map(mapMensagem);
}

export async function findBotRespostas({ pool, storeId }: StoreScope): Promise<BotResposta[]> {
  const r = await pool.query(
    `SELECT * FROM chat_bot_replies WHERE store_id = $1 ORDER BY "order" ASC, id ASC`,
    [storeId],
  );
  return r.rows.map(mapBotResposta);
}

export async function insertBotResposta(
  { pool, storeId }: StoreScope,
  input: CreateBotRespostaInput,
): Promise<BotResposta> {
  const r = await pool.query(
    `INSERT INTO chat_bot_replies (store_id, keyword, reply, "order")
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [storeId, input.palavra_chave.trim(), input.resposta.trim(), input.ordem ?? 0],
  );
  return mapBotResposta(r.rows[0]!);
}

export async function updateBotRespostaRecord(
  { pool, storeId }: StoreScope,
  id: number,
  input: UpdateBotRespostaInput,
): Promise<BotResposta | null> {
  const r = await pool.query(
    `UPDATE chat_bot_replies
     SET keyword = $1, reply = $2, "order" = $3, active = $4, updated_at = NOW()
     WHERE id = $5 AND store_id = $6 RETURNING *`,
    [
      input.palavra_chave.trim(),
      input.resposta.trim(),
      input.ordem ?? 0,
      input.ativo !== false,
      id,
      storeId,
    ],
  );
  if (!r.rows[0]) return null;
  return mapBotResposta(r.rows[0]);
}

export async function deleteBotRespostaRecord(
  { pool, storeId }: StoreScope,
  id: number,
): Promise<boolean> {
  const r = await pool.query(`DELETE FROM chat_bot_replies WHERE id = $1 AND store_id = $2`, [
    id,
    storeId,
  ]);
  return (r.rowCount ?? 0) > 0;
}
