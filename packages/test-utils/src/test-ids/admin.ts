/**
 * data-testid do admin (React) — Fase 2.
 *
 * Regra: nunca duplicar a string literal entre componente e spec — sempre
 * importar destas constantes (`@lojao/test-utils/test-ids`).
 */
export const admin = {
  sidebarNav: 'admin-sidebar-nav',
  dashboardStats: 'admin-dashboard-stats',
  pedidosTable: 'admin-pedidos-table',
  pedidosEmpty: 'admin-pedidos-empty-state',
  pedidosLoading: 'admin-pedidos-loading',
  /** Linha de pedido (id dinâmico): `admin-pedidos-row-{id}`. */
  pedidosRow: (id: number | string): string => `admin-pedidos-row-${id}`,
} as const;
