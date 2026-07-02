/**
 * data-testid do Platform Hub (Ata Labs).
 */
export const platform = {
  loginEmail: 'platform-login-email-input',
  loginPassword: 'platform-login-password-input',
  loginSubmit: 'platform-login-submit-btn',
  loginError: 'platform-login-error-msg',
  sidebarNav: 'platform-sidebar-nav',
  mobileMenuBtn: 'platform-mobile-menu-btn',
  storesList: 'platform-stores-list',
  storesEmpty: 'platform-stores-empty-state',
  /** Linha de loja (slug dinâmico): `platform-stores-row-{slug}`. */
  storesRow: (slug: string): string => `platform-stores-row-${slug}`,
  storeCreateLink: 'platform-store-create-link',
  storeCreateForm: 'platform-store-create-form',
  storeCreateSlug: 'platform-store-create-slug',
  storeCreateNome: 'platform-store-create-nome',
  storeCreateSubmit: 'platform-store-create-submit',
  storeCreateError: 'platform-store-create-error',
  storeDetail: 'platform-store-detail',
  storeToggleAtivo: 'platform-store-toggle-ativo',
  storeSaveNome: 'platform-store-save-nome',
  uiThemeSwitch: 'platform-ui-theme-switch',
} as const;
