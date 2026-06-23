/**
 * data-testid do fluxo self-service de onboarding (storefront M7).
 */
export const signup = {
  /** Página /signup (resumo do plano + CTA checkout) */
  page: 'signup-page',
  /** CTA "Continuar" da /signup → /signup/checkout */
  continue: 'signup-continue',
  /** Página /signup/checkout */
  checkoutPage: 'signup-checkout-page',
  /** Input do slug da loja (step 1) */
  checkoutSlugInput: 'signup-checkout-slug-input',
  /** Botão de avançar step */
  checkoutNext: 'signup-checkout-next',
  /** Submit final do checkout */
  checkoutSubmit: 'signup-checkout-submit',
  /** Mensagem de erro do checkout */
  checkoutError: 'signup-checkout-error',
  /** Página /signup/success */
  successPage: 'signup-success-page',
  /** CTA "Ir para o painel" (admin login, sem slug) */
  successAdminLink: 'signup-success-admin-link',
  /** CTA "Ver minha loja" (/store/{slug}) */
  successStoreLink: 'signup-success-store-link',
} as const;
