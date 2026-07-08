import type { StoreScope } from '../../lib/store-scope.js';
import {
  findBotKeywords,
  findConversationBotActive,
  findOrCreateConversation,
  insertMessage,
  touchConversation,
} from './store-chat.repository.js';

const BOT_DELAY_MS =
  process.env.NODE_ENV === 'test' ? 0 : parseInt(process.env.BOT_RESPONSE_DELAY_MS ?? '900', 10);

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

export async function findBotResponse(
  scope: Pick<StoreScope, 'pool' | 'storeId'>,
  mensagem: string,
): Promise<string | null> {
  const keywords = await findBotKeywords(scope);
  const lower = mensagem.toLowerCase();

  for (const row of keywords) {
    const keys = row.keyword
      .toLowerCase()
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    if (keys.some((k) => lower.includes(k))) {
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
  const conteudo = opts.conteudo.trim().slice(0, 2000);
  if (!conteudo) throw new Error('Mensagem vazia');

  const conversaId =
    opts.conversaId ??
    (await findOrCreateConversation(
      scope,
      opts.sessionId,
      opts.nome || 'Visitante',
      opts.usuarioId,
    ));

  const msgRow = await insertMessage(scope, conversaId, 'customer', conteudo);
  await touchConversation(scope, conversaId);

  const botAtivo = await findConversationBotActive(scope, conversaId);
  let botMensagem: Record<string, unknown> | undefined;

  if (botAtivo) {
    const resposta = await findBotResponse(scope, conteudo);
    if (resposta) {
      if (BOT_DELAY_MS > 0) {
        await new Promise((resolve) => setTimeout(resolve, BOT_DELAY_MS));
      }
      const botRow = await insertMessage(scope, conversaId, 'bot', resposta);
      botMensagem = mapMensagemToApi(botRow);
    }
  }

  return {
    conversa_id: conversaId,
    mensagem: mapMensagemToApi(msgRow),
    bot_mensagem: botMensagem,
  };
}
