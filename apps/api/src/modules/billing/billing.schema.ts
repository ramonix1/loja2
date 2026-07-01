import { z } from 'zod';

export const monthYearQuerySchema = z.object({
  monthYear: z.string().optional(),
});

export const invoicesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).default(12),
});

export const assignPlanBodySchema = z.object({
  planSlug: z.string().min(1),
});

export const listAllInvoicesQuerySchema = z.object({
  monthYear: z.string().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type MonthYearQuery = z.infer<typeof monthYearQuerySchema>;
export type InvoicesQuery = z.infer<typeof invoicesQuerySchema>;
export type AssignPlanBody = z.infer<typeof assignPlanBodySchema>;
export type ListAllInvoicesQuery = z.infer<typeof listAllInvoicesQuerySchema>;

export interface CommissionTransaction {
  id: string;
  tenant_id: number;
  pedido_id: number | null;
  order_total: number;
  commission_percentage: number;
  commission_amount: number;
  month_year: string;
  status: string;
}
