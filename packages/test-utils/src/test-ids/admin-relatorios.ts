/** data-testid do módulo admin Relatórios (Fase 3). */
export const adminRelatorios = {
  panel: 'admin-relatorios-panel',
  tabs: 'admin-relatorios-tabs',
  dateFilter: 'admin-relatorios-date-filter',
  dateInicioInput: 'admin-relatorios-date-inicio-input',
  dateFimInput: 'admin-relatorios-date-fim-input',
  dateFilterBtn: 'admin-relatorios-date-filter-btn',
  csvExportBtn: 'admin-relatorios-csv-export-btn',
  table: 'admin-relatorios-table',
  emptyState: 'admin-relatorios-empty-state',
  errorMsg: 'admin-relatorios-error-msg',
  tab: (id: string): string => `admin-relatorios-tab-${id}`,
  estoqueFilter: (filtro: string): string => `admin-relatorios-estoque-filter-${filtro}`,
} as const;
