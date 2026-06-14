/** data-testid do módulo admin Categorias (Fase 3). */
export const adminCategorias = {
  table: 'admin-categorias-table',
  createBtn: 'admin-categorias-create-btn',
  formSubmit: 'admin-categorias-form-submit-btn',
  deleteBtn: 'admin-categorias-delete-btn',
  nomeInput: 'admin-categorias-nome-input',
  ordemInput: 'admin-categorias-ordem-input',
  emptyState: 'admin-categorias-empty-state',
  row: (id: number | string): string => `admin-categorias-row-${id}`,
} as const;
