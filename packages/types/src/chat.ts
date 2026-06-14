import { z } from 'zod';

export const createBotRespostaSchema = z.object({
  palavra_chave: z.string().trim().min(1, 'Palavra-chave obrigatória.'),
  resposta: z.string().trim().min(1, 'Resposta obrigatória.'),
  ordem: z.coerce.number().int().optional(),
});

export const updateBotRespostaSchema = z.object({
  palavra_chave: z.string().trim().min(1, 'Palavra-chave obrigatória.'),
  resposta: z.string().trim().min(1, 'Resposta obrigatória.'),
  ordem: z.coerce.number().int().optional(),
  ativo: z.boolean().optional(),
});

export type CreateBotRespostaInput = z.infer<typeof createBotRespostaSchema>;
export type UpdateBotRespostaInput = z.infer<typeof updateBotRespostaSchema>;

export type ChatConversa = {
  id: number;
  session_id: string;
  usuario_id: number | null;
  nome_visitante: string;
  status: 'aberta' | 'encerrada';
  bot_ativo: boolean;
  created_at: string;
  updated_at: string;
  nao_lidas: number;
};

export type ChatMensagem = {
  id: number;
  conversa_id: number;
  remetente: 'cliente' | 'bot' | 'admin';
  conteudo: string;
  lida: boolean;
  created_at: string;
};

export type BotResposta = {
  id: number;
  palavra_chave: string;
  resposta: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};
