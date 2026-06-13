import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email é obrigatório.'),
  senha: z.string().min(1, 'Senha é obrigatória.'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres.'),
  email: z.string().email('Email inválido.'),
  senha: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres.'),
  confirmacao: z.string().min(8),
  telefone: z.string().min(10, 'Telefone inválido.'),
  cep: z.string().min(8, 'CEP inválido.'),
  logradouro: z.string().min(1, 'Logradouro obrigatório.'),
  numero: z.string().min(1, 'Número obrigatório.'),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'Bairro obrigatório.'),
  cidade: z.string().min(1, 'Cidade obrigatória.'),
  estado: z.string().length(2, 'Estado inválido.'),
}).refine((d) => d.senha === d.confirmacao, {
  message: 'As senhas não coincidem.',
  path: ['confirmacao'],
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const recoverPasswordSchema = z.object({
  email: z.string().email('Email inválido.'),
});

export type RecoverPasswordInput = z.infer<typeof recoverPasswordSchema>;

export const resetPasswordSchema = z.object({
  senha: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres.'),
  confirmacao: z.string().min(8),
}).refine((d) => d.senha === d.confirmacao, {
  message: 'As senhas não coincidem.',
  path: ['confirmacao'],
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
