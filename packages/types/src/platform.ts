import { z } from 'zod';

/** Slug de loja (vitrine): minúsculas, números e hífen; 2–50 chars. */
export const platformStoreSlugSchema = z
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

export const createPlatformStoreSchema = z.object({
  slug: platformStoreSlugSchema,
  nome: z.string().trim().min(2, 'Nome obrigatório.').max(100, 'Nome muito longo.'),
  plano: z.string().trim().max(20).optional(),
});

export type CreatePlatformStoreInput = z.infer<typeof createPlatformStoreSchema>;

export const updatePlatformStoreSchema = z
  .object({
    nome: z.string().trim().min(2, 'Nome obrigatório.').max(100).optional(),
    ativo: z.boolean().optional(),
    plano: z.string().trim().max(20).optional(),
  })
  .refine((d) => d.nome !== undefined || d.ativo !== undefined || d.plano !== undefined, {
    message: 'Informe ao menos um campo para atualizar.',
  });

export type UpdatePlatformStoreInput = z.infer<typeof updatePlatformStoreSchema>;

/** Loja exposta pelo Platform Hub (sem credenciais de banco). */
export interface PlatformStore {
  id: number;
  slug: string;
  nome: string;
  plano: string | null;
  ativo: boolean;
  createdAt: string | null;
}

export interface PlatformDashboardStats {
  totalStores: number;
  activeStores: number;
  suspendedStores: number;
  newStores30d: number;
  totalMerchants: number;
  trialsExpiring7d: number;
  orders30d: number | null;
  gmv30dCents: number | null;
  gmvGrowthPct: number | null;
  topStore: { slug: string; nome: string; gmv30dCents: number } | null;
}

export type PlatformStoreHealth = 'healthy' | 'attention' | 'suspended';

export interface PlatformStoreListItem extends PlatformStore {
  merchantName?: string;
  merchantSlug?: string;
  orders30d?: number;
  gmv30dCents?: number;
  health: PlatformStoreHealth;
  logoUrl?: string | null;
}

/** Merchant (conta) exposto pelo Platform Hub — listagem `/platform/merchants` (P3). */
export interface PlatformMerchantListItem {
  id: number;
  slug: string;
  name: string;
  ativo: boolean;
  plano: string | null;
  storesCount: number;
  createdAt: string | null;
}

/** Detalhe enriquecido de loja — GET `/platform/stores/:slug` (P4). */
export interface PlatformStoreDetail extends PlatformStore {
  merchantId: number;
  merchantSlug: string;
  merchantName: string;
  health: PlatformStoreHealth;
}

/** KPIs e saúde por loja — GET `/platform/stores/:slug/metrics` (P4). */
export interface PlatformStoreMetrics {
  orders30d: number | null;
  gmv30dCents: number | null;
  lastOrderAt: string | null;
  health: PlatformStoreHealth;
  healthReasons: string[];
}

/** Billing read-only da conta merchant da loja — GET `/platform/stores/:slug/billing` (P4). */
export interface PlatformStoreBilling {
  status: string | null;
  planSlug: string | null;
  planName: string | null;
  monthlyFee: number | null;
  trialEndsAt: string | null;
  nextBillingDate: string | null;
  invoicesCount: number;
}

export interface PlatformHealthItem {
  slug: string;
  nome: string;
  merchantSlug: string;
  health: PlatformStoreHealth;
  reasons: string[];
}

/** Resumo de saúde operacional — GET `/platform/health` (P4). */
export interface PlatformHealthSummary {
  healthyStores: number;
  attentionStores: number;
  suspendedStores: number;
  trialsExpiring7d: number;
  merchantsWithoutBilling: number;
  items: PlatformHealthItem[];
}

export interface PlatformReportsSummary {
  totalMerchants: number;
  trialingMerchants: number;
  activeBillingMerchants: number;
  trialsExpiring7d: number;
  revenueMonth: {
    month: string;
    total: number;
    paidInvoices: number;
    pendingInvoices: number;
  } | null;
  recentStores: Array<{ slug: string; nome: string; createdAt: string | null }>;
}
