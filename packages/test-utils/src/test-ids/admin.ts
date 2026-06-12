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
  pedidosFilterStatus: 'admin-pedidos-filter-status',
  pedidosViewBtn: (id: number | string): string => `admin-pedidos-view-btn-${id}`,
  dashboardRecentOrders: 'admin-dashboard-recent-orders',
  dashboardRecentRow: (id: number | string): string => `admin-dashboard-recent-row-${id}`,
  dashboardCharts: 'admin-dashboard-charts',
  dashboardChartRevenue: 'admin-dashboard-chart-revenue',
  dashboardChartStatus: 'admin-dashboard-chart-status',
  dashboardChartPayment: 'admin-dashboard-chart-payment',
  dashboardChartTopProducts: 'admin-dashboard-chart-top-products',
  dashboardChartEmpty: 'admin-dashboard-chart-empty',
  dashboardChartPeriod: (period: '7d' | '30d' | '90d'): string =>
    `admin-dashboard-chart-period-${period}`,
} as const;
