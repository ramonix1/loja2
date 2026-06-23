import { z } from 'zod';

import { tenantSlugSchema } from './platform.js';

/**
 * Slugs reservados: não podem ser usados como slug de loja no signup público.
 * Inclui rotas de plataforma, termos de marca e palavras de sistema.
 */
export const RESERVED_SLUGS = [
  'demo',
  'admin',
  'api',
  'www',
  'app',
  'platform',
  'store',
  'signup',
  'login',
  'logout',
  'dashboard',
  'static',
  'assets',
  'images',
  'health',
  'public',
  'auth',
  'billing',
  'checkout',
  'success',
  'pricing',
  'support',
  'suporte',
  'ata',
  'atalabs',
  'atacommerce',
  'ata-commerce',
  'ata-labs',
] as const;

/** Indica se um slug (já normalizado) é reservado pela plataforma. */
export function isReservedSlug(slug: string): boolean {
  return (RESERVED_SLUGS as readonly string[]).includes(slug.trim().toLowerCase());
}

export const signupPlanSchema = z.enum(['starter', 'professional', 'enterprise']);
export type SignupPlan = z.infer<typeof signupPlanSchema>;

export const billingCycleSchema = z.enum(['monthly', 'annual']);
export type BillingCycle = z.infer<typeof billingCycleSchema>;

export const signupPaymentMethodSchema = z.enum(['card', 'pix']);

/**
 * Slug de loja para signup. Mantém a regra de formato de tenant; o bloqueio de
 * slugs reservados é feito na camada de rota/serviço (`checkSlugAvailability`),
 * para devolver `409 SLUG_RESERVED` em vez de erro genérico de validação.
 */
export const signupSlugSchema = tenantSlugSchema;

export const signupSchema = z.object({
  planSlug: signupPlanSchema,
  billingCycle: billingCycleSchema.default('monthly'),
  trial: z.boolean().default(true),
  loja: z.object({
    nome: z.string().trim().min(2, 'Nome da loja obrigatório.').max(100, 'Nome muito longo.'),
    slug: signupSlugSchema,
  }),
  admin: z.object({
    nome: z.string().trim().min(2, 'Nome obrigatório.').max(100, 'Nome muito longo.'),
    email: z.string().trim().toLowerCase().email('E-mail inválido.'),
    senha: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres.').max(128, 'Senha muito longa.'),
  }),
  // OUT no MVP G: trial sem cartão. Aceito no contrato para uso futuro (G.2).
  payment: z
    .object({
      method: signupPaymentMethodSchema,
    })
    .optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;

/** Resposta de sucesso de `POST /public/signup`. */
export interface SignupResult {
  tenantSlug: string;
  lojaNome: string;
  adminEmail: string;
  storefrontUrl: string;
  adminUrl: string;
  trialEndsAt?: string;
}

/** Plano público exposto em `GET /public/signup/plans` (mirror do marketing). */
export interface SignupPlanPublic {
  slug: SignupPlan;
  name: string;
  priceMonthly: number | null;
  priceLabel?: string;
  billingCycle: BillingCycle[];
  highlighted: boolean;
  features: string[];
}

/**
 * Mirror dos planos de marketing (`apps/storefront/src/lib/marketing/plans.ts`).
 * Mantido aqui para a API pública não depender do app storefront.
 */
export const SIGNUP_PLANS: SignupPlanPublic[] = [
  {
    slug: 'starter',
    name: 'Starter',
    priceMonthly: 79,
    billingCycle: ['monthly', 'annual'],
    highlighted: false,
    features: [
      'até 50 produtos',
      '1 usuário',
      'Pagamentos (Pix, Boleto, Cartão)',
      'Suporte por e-mail',
      'Domínio personalizado',
    ],
  },
  {
    slug: 'professional',
    name: 'Professional',
    priceMonthly: 199,
    billingCycle: ['monthly', 'annual'],
    highlighted: true,
    features: [
      'até 500 produtos',
      'até 5 usuários',
      'Pagamentos + Cupons',
      'Suporte prioritário',
      'Relatórios avançados',
      'Domínio personalizado',
    ],
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    priceMonthly: null,
    priceLabel: 'Personalizado',
    billingCycle: ['monthly', 'annual'],
    highlighted: false,
    features: [
      'Produtos ilimitados',
      'Usuários ilimitados',
      'Integrações customizadas',
      'Suporte 24/7 dedicado',
      'SLA garantida',
    ],
  },
];

/** Preço anual com desconto de 15% (alinhado ao marketing). */
export function signupAnnualPrice(monthly: number): number {
  return Math.round(monthly * 12 * 0.85);
}
