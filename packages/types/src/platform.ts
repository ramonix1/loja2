import { z } from 'zod';

/** Slug de tenant: minúsculas, números e hífen; 2–50 chars. */
export const tenantSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, 'Slug deve ter pelo menos 2 caracteres.')
  .max(50, 'Slug muito longo.')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use apenas letras minúsculas, números e hífen.');

export const platformLoginSchema = z.object({
  email: z.string().min(1, 'E-mail é obrigatório.'),
  senha: z.string().min(1, 'Senha é obrigatória.'),
});

export type PlatformLoginInput = z.infer<typeof platformLoginSchema>;

export const createTenantSchema = z.object({
  slug: tenantSlugSchema,
  nome: z.string().trim().min(2, 'Nome obrigatório.').max(100, 'Nome muito longo.'),
  plano: z.string().trim().max(20).optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;

export const updateTenantSchema = z
  .object({
    nome: z.string().trim().min(2, 'Nome obrigatório.').max(100).optional(),
    ativo: z.boolean().optional(),
    plano: z.string().trim().max(20).optional(),
  })
  .refine((d) => d.nome !== undefined || d.ativo !== undefined || d.plano !== undefined, {
    message: 'Informe ao menos um campo para atualizar.',
  });

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;

/** Item de tenant exposto pelo Platform Hub (sem credenciais de banco). */
export interface PlatformTenant {
  id: number;
  slug: string;
  nome: string;
  plano: string | null;
  ativo: boolean;
  createdAt: string | null;
}
