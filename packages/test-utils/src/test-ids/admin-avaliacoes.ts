/** data-testid do módulo admin Avaliações (vitrine Onda 6). */
export const adminAvaliacoes = {
  panel: 'admin-avaliacoes-panel',
  table: 'admin-avaliacoes-table',
  emptyState: 'admin-avaliacoes-empty-state',
  row: (id: number | string): string => `admin-avaliacoes-row-${id}`,
  rejectBtn: (id: number | string): string => `admin-avaliacoes-reject-btn-${id}`,
  filterStatus: 'admin-avaliacoes-filter-status',
} as const;
