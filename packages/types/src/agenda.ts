import { z } from 'zod';

export const agendaQuerySchema = z.object({
  mes: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
});

export const updateAgendaConfigSchema = z.object({
  capacidade_diaria: z.coerce.number().int().min(1).default(1),
  antecedencia_minima_dias: z.coerce.number().int().min(0).default(1),
  antecedencia_maxima_dias: z.coerce.number().int().min(1).default(180),
});

export const saveAgendaDiaSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  capacidade: z.union([z.coerce.number().int().min(0), z.null()]).optional(),
  motivo: z.string().max(255).nullable().optional(),
});

export type AgendaConfig = {
  capacidade_diaria: number;
  antecedencia_minima_dias: number;
  antecedencia_maxima_dias: number;
};

export type AgendaDiaEspecial = {
  data: string;
  capacidade: number | null;
  motivo: string | null;
};

export type AgendaAdminData = {
  config: AgendaConfig;
  mes: string;
  ano: number;
  mesNum: number;
  lastDay: number;
  especiais: AgendaDiaEspecial[];
  agendadosMap: Record<string, number>;
};

export type UpdateAgendaConfigInput = z.infer<typeof updateAgendaConfigSchema>;
export type SaveAgendaDiaInput = z.infer<typeof saveAgendaDiaSchema>;
