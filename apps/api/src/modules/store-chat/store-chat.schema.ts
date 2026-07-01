import { z } from 'zod';

export const messageSchema = z.object({
  conteudo: z.string().min(1).max(2000),
  conversa_id: z.number().int().positive().optional(),
  nome: z.string().max(100).optional(),
});

export type StoreChatMessageInput = z.infer<typeof messageSchema>;
