export interface MarketingPlan {
  slug: 'starter' | 'professional' | 'enterprise';
  name: string;
  priceMonthly: number | null;
  priceLabel?: string;
  setup: string;
  audience: string;
  highlighted: boolean;
  cta: string;
  features: string[];
}

export const MARKETING_PLANS: MarketingPlan[] = [
  {
    slug: 'starter',
    name: 'Starter',
    priceMonthly: 79,
    setup: 'R$ 0',
    audience: 'Perfeito para começar',
    highlighted: false,
    cta: 'Começar grátis',
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
    setup: 'R$ 0',
    audience: 'Para negócios em crescimento',
    highlighted: true,
    cta: 'Começar agora',
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
    setup: 'Sob consulta',
    audience: 'Soluções personalizadas',
    highlighted: false,
    cta: 'Solicitar proposta',
    features: [
      'Produtos ilimitados',
      'Usuários ilimitados',
      'Integrações customizadas',
      'Suporte 24/7 dedicado',
      'Análises customizadas',
      'SLA garantida',
    ],
  },
];

export const PLAN_COMMON_FEATURES = [
  'Loja virtual em atalabs.com.br/store/{seu-slug}',
  'Painel admin em app.atalabs.com.br',
  'Pagamentos: cartão, Pix, boleto (via gateways configurados)',
  'SSL e hospedagem inclusos',
  'Suporte por e-mail',
  '14 dias de trial gratuito — sem cartão',
] as const;

export interface PlanComparisonRow {
  label: string;
  starter: string | boolean;
  professional: string | boolean;
  enterprise: string | boolean;
}

export const PLAN_COMPARISON_ROWS: PlanComparisonRow[] = [
  { label: 'Produtos', starter: 'até 50', professional: 'até 500', enterprise: 'Ilimitado' },
  { label: 'Usuários admin', starter: '1', professional: '5', enterprise: 'Ilimitado' },
  { label: 'Cupons e promoções', starter: false, professional: true, enterprise: true },
  { label: 'Relatórios avançados', starter: false, professional: true, enterprise: true },
  { label: 'Suporte prioritário', starter: false, professional: true, enterprise: true },
  { label: 'Integrações customizadas', starter: false, professional: false, enterprise: true },
  { label: 'Domínio próprio', starter: '✓', professional: '✓', enterprise: '✓' },
];

/** Preço anual com desconto de 15%. */
export function annualPrice(monthly: number): number {
  return Math.round(monthly * 12 * 0.85);
}

/** Formata valor em BRL sem casas decimais. */
export function formatPlanPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
