/**
 * data-testid de autenticação.
 *
 * Valores definidos na Fase 0; aplicados na UI React a partir da Fase 2.
 * Regra: nunca duplicar a string literal entre componente e spec — sempre
 * importar destas constantes (`@lojao/test-utils/test-ids`).
 */
export const auth = {
  loginBrand: 'admin-login-brand',
  loginSlug: 'admin-login-slug-input',
  loginEmail: 'auth-login-email-input',
  loginPassword: 'auth-login-password-input',
  loginSubmit: 'auth-login-submit-btn',
  loginError: 'auth-login-error-msg',
} as const;
