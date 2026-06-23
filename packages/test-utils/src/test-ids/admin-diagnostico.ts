/** data-testid do módulo admin Diagnóstico (Fase 3). */
export const adminDiagnostico = {
  panel: 'admin-diagnostico-panel',
  results: 'admin-diagnostico-results',
  item: (nome: string): string =>
    `admin-diagnostico-item-${nome.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  refreshBtn: 'admin-diagnostico-refresh-btn',
  helpSection: 'admin-diagnostico-help-section',
  configLink: 'admin-diagnostico-config-link',
  tokenSwatch: 'admin-diagnostico-token-swatch',
  tokenSwatchSwitch: 'admin-diagnostico-token-swatch-switch',
} as const;
