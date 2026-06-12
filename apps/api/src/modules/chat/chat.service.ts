import type {
  BotResposta,
  ChatConversa,
  ChatMensagem,
  CreateBotRespostaInput,
  UpdateBotRespostaInput,
} from '@lojao/types/chat';
import type pg from 'pg';

function mapConversa(row: Record<string, unknown>): ChatConversa {
  return {
    id: Number(row.id),
    session_id: String(row.session_id),
    usuario_id: row.usuario_id === null ? null : Number(row.usuario_id),
    nome_visitante: String(row.nome_visitante),
    status: row.status as ChatConversa['status'],
    bot_ativo: Boolean(row.bot_ativo),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    nao_lidas: Number(row.nao_lidas ?? 0),
  };
}

function mapMensagem(row: Record<string, unknown>): ChatMensagem {
  return {
    id: Number(row.id),
    conversa_id: Number(row.conversa_id),
    remetente: row.remetente as ChatMensagem['remetente'],
    conteudo: String(row.conteudo),
    lida: Boolean(row.lida),
    created_at: String(row.created_at),
  };
}

function mapBotResposta(row: Record<string, unknown>): BotResposta {
  return {
    id: Number(row.id),
    palavra_chave: String(row.palavra_chave),
    resposta: String(row.resposta),
    ordem: Number(row.ordem ?? 0),
    ativo: Boolean(row.ativo),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

const LIST_CONVERSAS_SQL = `
  SELECT c.*,
    (SELECT COUNT(*)::int FROM mensagens m
     WHERE m.conversa_id = c.id AND m.lida = false AND m.remetente = 'cliente') AS nao_lidas
  FROM conversas c
  ORDER BY c.updated_at DESC
  LIMIT 200
`;

/** Porta `chatController.listarConversas`. */
export async function listConversas(db: pg.Pool): Promise<ChatConversa[]> {
  const r = await db.query(LIST_CONVERSAS_SQL);
  return r.rows.map(mapConversa);
}

/** Porta `chatController.mensagensConversa`. */
export async function getMensagensConversa(
  db: pg.Pool,
  conversaId: number,
): Promise<ChatMensagem[] | null> {
  const exists = await db.query('SELECT id FROM conversas WHERE id = $1', [conversaId]);
  if (!exists.rows[0]) return null;

  await db.query(
    `UPDATE mensagens SET lida = true WHERE conversa_id = $1 AND remetente = 'cliente'`,
    [conversaId],
  );

  const r = await db.query(
    `SELECT * FROM mensagens WHERE conversa_id = $1 ORDER BY created_at ASC`,
    [conversaId],
  );
  return r.rows.map(mapMensagem);
}

export async function listBotRespostas(db: pg.Pool): Promise<BotResposta[]> {
  const r = await db.query(`SELECT * FROM bot_respostas ORDER BY ordem ASC, id ASC`);
  return r.rows.map(mapBotResposta);
}

/** Porta `chatController.criarBotResposta`. */
export async function createBotResposta(
  db: pg.Pool,
  input: CreateBotRespostaInput,
): Promise<BotResposta> {
  const r = await db.query(
    `INSERT INTO bot_respostas (palavra_chave, resposta, ordem) VALUES ($1, $2, $3) RETURNING *`,
    [input.palavra_chave.trim(), input.resposta.trim(), input.ordem ?? 0],
  );
  return mapBotResposta(r.rows[0]!);
}

/** Porta `chatController.atualizarBotResposta`. */
export async function updateBotResposta(
  db: pg.Pool,
  id: number,
  input: UpdateBotRespostaInput,
): Promise<BotResposta | null> {
  const r = await db.query(
    `UPDATE bot_respostas
     SET palavra_chave = $1, resposta = $2, ordem = $3, ativo = $4, updated_at = NOW()
     WHERE id = $5 RETURNING *`,
    [
      input.palavra_chave.trim(),
      input.resposta.trim(),
      input.ordem ?? 0,
      input.ativo !== false,
      id,
    ],
  );
  if (!r.rows[0]) return null;
  return mapBotResposta(r.rows[0]);
}

/** Porta `chatController.excluirBotResposta`. */
export async function deleteBotResposta(db: pg.Pool, id: number): Promise<boolean> {
  const r = await db.query(`DELETE FROM bot_respostas WHERE id = $1`, [id]);
  return (r.rowCount ?? 0) > 0;
}
