/** data-testid do módulo admin Banners (Fase 3). */
export const adminBanners = {
  table: 'admin-banners-table',
  createBtn: 'admin-banners-create-btn',
  formSubmit: 'admin-banners-form-submit-btn',
  deleteBtn: 'admin-banners-delete-btn',
  tituloInput: 'admin-banners-titulo-input',
  imagemInput: 'admin-banners-imagem-input',
  emptyState: 'admin-banners-empty-state',
  row: (id: number | string): string => `admin-banners-row-${id}`,
} as const;
