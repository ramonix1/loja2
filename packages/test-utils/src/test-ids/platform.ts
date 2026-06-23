/**
 * data-testid do Platform Hub (Ata Labs) — Fase F.
 *
 * Regra: nunca duplicar a string literal entre componente e spec — sempre
 * importar destas constantes (`@lojao/test-utils/test-ids`).
 */
export const platform = {
  loginEmail: 'platform-login-email-input',
  loginPassword: 'platform-login-password-input',
  loginSubmit: 'platform-login-submit-btn',
  loginError: 'platform-login-error-msg',
  sidebarNav: 'platform-sidebar-nav',
  mobileMenuBtn: 'platform-mobile-menu-btn',
  tenantsList: 'platform-tenants-list',
  tenantsEmpty: 'platform-tenants-empty-state',
  /** Linha de tenant (slug dinâmico): `platform-tenants-row-{slug}`. */
  tenantsRow: (slug: string): string => `platform-tenants-row-${slug}`,
  tenantCreateLink: 'platform-tenant-create-link',
  tenantCreateForm: 'platform-tenant-create-form',
  tenantCreateSlug: 'platform-tenant-create-slug',
  tenantCreateNome: 'platform-tenant-create-nome',
  tenantCreateSubmit: 'platform-tenant-create-submit',
  tenantCreateError: 'platform-tenant-create-error',
  tenantDetail: 'platform-tenant-detail',
  tenantToggleAtivo: 'platform-tenant-toggle-ativo',
  tenantSaveNome: 'platform-tenant-save-nome',
  uiThemeSwitch: 'platform-ui-theme-switch',
} as const;
