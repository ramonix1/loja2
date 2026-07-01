import type {
  BotResposta,
  ChatConversa,
  ChatMensagem,
  CreateBotRespostaInput,
  UpdateBotRespostaInput,
} from '@lojao/types/chat';
import type pg from 'pg';

import {
  conversaExists,
  deleteBotRespostaRecord,
  findAllBotRespostas,
  findAllConversas,
  findMensagensByConversaId,
  insertBotResposta,
  markMensagensClienteAsRead,
  updateBotRespostaRecord,
} from './chat.repository.js';

/** Porta `chatController.listarConversas`. */
export async function listConversas(db: pg.Pool): Promise<ChatConversa[]> {
  return findAllConversas(db);
}

/** Porta `chatController.mensagensConversa`. */
export async function getMensagensConversa(
  db: pg.Pool,
  conversaId: number,
): Promise<ChatMensagem[] | null> {
  if (!(await conversaExists(db, conversaId))) return null;

  await markMensagensClienteAsRead(db, conversaId);
  return findMensagensByConversaId(db, conversaId);
}

export async function listBotRespostas(db: pg.Pool): Promise<BotResposta[]> {
  return findAllBotRespostas(db);
}

/** Porta `chatController.criarBotResposta`. */
export async function createBotResposta(
  db: pg.Pool,
  input: CreateBotRespostaInput,
): Promise<BotResposta> {
  return insertBotResposta(db, input);
}

/** Porta `chatController.atualizarBotResposta`. */
export async function updateBotResposta(
  db: pg.Pool,
  id: number,
  input: UpdateBotRespostaInput,
): Promise<BotResposta | null> {
  return updateBotRespostaRecord(db, id, input);
}

/** Porta `chatController.excluirBotResposta`. */
export async function deleteBotResposta(db: pg.Pool, id: number): Promise<boolean> {
  return deleteBotRespostaRecord(db, id);
}
