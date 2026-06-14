/** data-testid do módulo admin Compradores (Fase 3). */
export const adminCompradores = {
  stats: 'admin-compradores-stats',
  table: 'admin-compradores-table',
  searchInput: 'admin-compradores-search-input',
  searchBtn: 'admin-compradores-search-btn',
  searchClearBtn: 'admin-compradores-search-clear-btn',
  emptyState: 'admin-compradores-empty-state',
  detailPanel: 'admin-compradores-detail-panel',
  detailBackBtn: 'admin-compradores-detail-back-btn',
  row: (id: number | string): string => `admin-compradores-row-${id}`,
  detailBtn: (id: number | string): string => `admin-compradores-detail-btn-${id}`,
} as const;
