import { z } from 'zod';

/**
 * MA3 — tipos do domínio `merchant` (conta Ata Commerce → N lojas).
 * Ver docs/specs/merchant-account-architecture-spec.md.
 */

/** Slug de merchant: mesma regra de `platformStoreSlugSchema`. */
export const merchantSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, 'Slug deve ter pelo menos 2 caracteres.')
  .max(50, 'Slug muito longo.')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use apenas letras minúsculas, números e hífen.');

export const createMerchantSchema = z.object({
  slug: merchantSlugSchema,
  name: z.string().trim().min(2, 'Nome obrigatório.').max(150, 'Nome muito longo.'),
});

export type CreateMerchantInput = z.infer<typeof createMerchantSchema>;

/** Merchant exposto pela API (sem credenciais de banco). */
export interface MerchantSummary {
  id: number;
  slug: string;
  name: string;
  active: boolean;
  /** MA6 — limite de lojas do plano contratado; ver `MERCHANT_PLAN_MAX_STORES`. */
  maxStores: number;
  createdAt: string | null;
}

/** MA4 — slug de loja: mesma regra de `merchantSlugSchema` (único globalmente no master). */
export const storeSlugSchema = merchantSlugSchema;

/** MA4 — loja (`stores`) exposta pela API. */
export interface StoreSummary {
  id: number;
  slug: string;
  name: string;
  active: boolean;
  merchantId: number;
  createdAt: string | null;
}

/**
 * MA6 — plano contratado no signup self-service (spec §2.4). Mesmos slugs de
 * `@lojao/types/signup` (`SIGNUP_PLANS`), mas o limite de **lojas** é uma regra
 * própria da initiative merchant-account (independente dos limites de
 * produtos/usuários do marketing).
 */
export const merchantAccountPlanSchema = z.enum(['starter', 'professional', 'enterprise']);
export type MerchantAccountPlan = z.infer<typeof merchantAccountPlanSchema>;

/**
 * Limite de lojas (`max_stores`) por plano — spec §2.4. `enterprise` é "sob
 * contrato" (sem número fixo na spec); usa-se um teto alto como sentinela até
 * a fase de billing (MA7) modelar limites customizados por contrato.
 */
export const MERCHANT_PLAN_MAX_STORES: Record<MerchantAccountPlan, number> = {
  starter: 1,
  professional: 3,
  enterprise: 999,
};

/** MA6 — cadastro self-service de uma conta merchant: conta + owner + loja #1. */
export const merchantSignupSchema = z.object({
  planSlug: merchantAccountPlanSchema,
  merchant: z.object({
    slug: merchantSlugSchema,
    name: z.string().trim().min(2, 'Nome da conta obrigatório.').max(150, 'Nome muito longo.'),
  }),
  store: z.object({
    slug: storeSlugSchema,
    name: z.string().trim().min(2, 'Nome da loja obrigatório.').max(100, 'Nome muito longo.'),
  }),
  owner: z.object({
    name: z.string().trim().min(2, 'Nome obrigatório.').max(150, 'Nome muito longo.'),
    email: z.string().trim().toLowerCase().email('E-mail inválido.'),
    senha: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres.').max(128, 'Senha muito longa.'),
  }),
});

export type MerchantSignupInput = z.infer<typeof merchantSignupSchema>;

/** Resposta de sucesso de `POST /public/merchant-signup`. */
export interface MerchantSignupResult {
  merchantSlug: string;
  merchantName: string;
  storeSlug: string;
  storeName: string;
  ownerEmail: string;
  storefrontUrl: string;
  adminUrl: string;
  /** MA7 — fim do trial 14d em `merchant_billing` (ISO 8601). */
  trialEndsAt?: string;
}

/** MA6 — criação de loja adicional (#2, #3…) dentro de uma conta já existente. */
export const createStoreSchema = z.object({
  slug: storeSlugSchema,
  name: z.string().trim().min(2, 'Nome da loja obrigatório.').max(100, 'Nome muito longo.'),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;

/** MA7 — atribuição de plano a conta merchant (Platform Hub). */
export const assignMerchantPlanSchema = z.object({
  planSlug: merchantAccountPlanSchema,
  /** Obrigatório quando `planSlug === 'enterprise'` (limite de lojas por contrato). */
  customMaxStores: z.number().int().min(1).max(9999).optional(),
});

export type AssignMerchantPlanInput = z.infer<typeof assignMerchantPlanSchema>;
