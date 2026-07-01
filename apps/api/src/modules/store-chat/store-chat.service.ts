import type pg from 'pg';

import {
  findActiveBotRespostas,
  findConversaBotAtivo,
  findOpenConversaBySession,
  insertConversa,
  insertMensagem,
  touchConversaUpdatedAt,
} from './store-chat.repository.js';

const BOT_DELAY_MS =
  process.env.NODE_ENV === 'test' ? 0 : parseInt(process.env.BOT_RESPONSE_DELAY_MS ?? '900', 10);

export async function findBotResponse(db: pg.Pool, mensagem: string): Promise<string | null> {
  const rows = await findActiveBotRespostas(db);
  const lower = mensagem.toLowerCase();
  for (const row of rows) {
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
    const existingId = await findOpenConversaBySession(db, opts.sessionId);
    if (existingId) {
      conversaId = existingId;
    } else {
      conversaId = await insertConversa(
        db,
        opts.sessionId,
        (opts.nome || 'Visitante').slice(0, 100),
        opts.usuarioId ?? null,
      );
    }
  }

  const mensagem = await insertMensagem(db, conversaId, 'cliente', conteudo);
  await touchConversaUpdatedAt(db, conversaId);

  let botMensagem: Record<string, unknown> | undefined;

  if (await findConversaBotAtivo(db, conversaId)) {
    const resposta = await findBotResponse(db, conteudo);
    if (resposta) {
      if (BOT_DELAY_MS > 0) {
        await new Promise((resolve) => setTimeout(resolve, BOT_DELAY_MS));
      }
      botMensagem = await insertMensagem(db, conversaId, 'bot', resposta);
    }
  }

  return {
    conversa_id: conversaId,
    mensagem,
    bot_mensagem: botMensagem,
  };
}
