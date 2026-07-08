import type {
  BotResposta,
  ChatConversa,
  ChatMensagem,
  CreateBotRespostaInput,
  UpdateBotRespostaInput,
} from '@lojao/types/chat';

import type { StoreScope } from '../../lib/store-scope.js';
import {
  deleteBotRespostaRecord,
  existsConversa,
  findBotRespostas,
  findConversas,
  findMensagensConversa,
  insertBotResposta,
  markMessagesRead,
  updateBotRespostaRecord,
} from './chat.repository.js';

export async function listConversas(scope: StoreScope): Promise<ChatConversa[]> {
  return findConversas(scope);
}

export async function getMensagensConversa(
  scope: StoreScope,
  conversaId: number,
): Promise<ChatMensagem[] | null> {
  const exists = await existsConversa(scope, conversaId);
  if (!exists) return null;

  await markMessagesRead(scope, conversaId);
  return findMensagensConversa(scope, conversaId);
}

export async function listBotRespostas(scope: StoreScope): Promise<BotResposta[]> {
  return findBotRespostas(scope);
}

export async function createBotResposta(
  scope: StoreScope,
  input: CreateBotRespostaInput,
): Promise<BotResposta> {
  return insertBotResposta(scope, input);
}

export async function updateBotResposta(
  scope: StoreScope,
  id: number,
  input: UpdateBotRespostaInput,
): Promise<BotResposta | null> {
  return updateBotRespostaRecord(scope, id, input);
}

export async function deleteBotResposta(scope: StoreScope, id: number): Promise<boolean> {
  return deleteBotRespostaRecord(scope, id);
}
