/**
 * data-testid do Platform Hub (Ata Labs).
 */
export const platform = {
  loginEmail: 'platform-login-email-input',
  loginPassword: 'platform-login-password-input',
  loginSubmit: 'platform-login-submit-btn',
  loginError: 'platform-login-error-msg',
  sidebarNav: 'platform-sidebar-nav',
  /** Alias legado — mesmo elemento que `sidebarTrigger` (SidebarTrigger shadcn). */
  mobileMenuBtn: 'platform-mobile-menu-btn',
  sidebarTrigger: 'sidebar-trigger',
  sidebarRail: 'sidebar-rail',
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
  dashboardPage: 'platform-dashboard-page',
  kpiStrip: 'kpi-strip',
  dashboardCharts: 'platform-dashboard-charts',
  dashboardChartNewStores: 'platform-dashboard-chart-new-stores',
  dashboardChartHealth: 'platform-dashboard-chart-health',
  dashboardChartBilling: 'platform-dashboard-chart-billing',
  dashboardChartPlans: 'platform-dashboard-chart-plans',
  dashboardChartEmpty: 'platform-dashboard-chart-empty',
  dashboardChartPeriod: (period: '7d' | '30d' | '90d'): string =>
    `platform-dashboard-chart-period-${period}`,
  storesToolbar: 'platform-stores-toolbar',
  storesSearch: 'platform-stores-search',
  storesFilterStatus: 'platform-stores-filter-status',
  storesFilterPlano: 'platform-stores-filter-plano',
  /** Card de loja (slug dinâmico): `platform-store-card-{slug}`. */
  storeCard: (slug: string): string => `platform-store-card-${slug}`,
  /** P3 — busca rápida global (⌘K / Ctrl+K). */
  commandPalette: 'command-palette',
  commandPaletteInput: 'command-palette-input',
  /** Item da paleta (id dinâmico): `command-palette-item-{id}`. */
  commandPaletteItem: (id: string): string => `command-palette-item-${id}`,
  /** P3 — sino de notificações no header. */
  notificationsTrigger: 'notifications-trigger',
  notificationsList: 'notifications-list',
  notificationsEmpty: 'notifications-empty',
  /** P3 — listagem de contas merchant. */
  merchantsPage: 'platform-merchants-page',
  merchantsToolbar: 'platform-merchants-toolbar',
  merchantsSearch: 'platform-merchants-search',
  merchantsFilterStatus: 'platform-merchants-filter-status',
  merchantsList: 'platform-merchants-list',
  merchantsEmpty: 'platform-merchants-empty-state',
  /** Linha de merchant (slug dinâmico): `platform-merchants-row-{slug}`. */
  merchantsRow: (slug: string): string => `platform-merchants-row-${slug}`,
  /** P4 — detalhe de loja com tabs. */
  storeTabOverview: 'platform-store-tab-overview',
  storeTabMerchant: 'platform-store-tab-merchant',
  storeTabBilling: 'platform-store-tab-billing',
  storeTabAcoes: 'platform-store-tab-acoes',
  storeMetrics: 'platform-store-metrics',
  /** P4 — saúde operacional. */
  healthPage: 'platform-health-page',
  healthKpiStrip: 'platform-health-kpi-strip',
  healthList: 'platform-health-list',
  healthEmpty: 'platform-health-empty-state',
  healthRow: (slug: string): string => `platform-health-row-${slug}`,
  /** P4 — relatórios / analytics. */
  reportsPage: 'platform-reports-page',
  reportsKpiStrip: 'platform-reports-kpi-strip',
  reportsRecentStores: 'platform-reports-recent-stores',
  settingsPage: 'platform-settings-page',
} as const;
