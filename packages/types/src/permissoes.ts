import { z } from 'zod';

export const createAdminSchema = z.object({
  nome: z.string().trim().min(3, 'Nome inválido.'),
  email: z.string().trim().email('Email inválido.'),
  senha: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres.'),
  cpf: z.string().trim().optional().nullable(),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;

export type AdminPermissao = {
  id: number;
  nome: string;
  email: string;
  cpf: string | null;
  ativo: boolean;
  ultimo_acesso: string | null;
  created_at: string;
};
