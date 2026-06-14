/** data-testid do módulo admin Produtos (Fase 3). */
export const adminProdutos = {
  table: 'admin-produtos-table',
  createForm: 'admin-produtos-create-form',
  nomeInput: 'admin-produtos-nome-input',
  valorInput: 'admin-produtos-valor-input',
  imagensInput: 'admin-produtos-imagens-input',
  formSubmit: 'admin-produtos-form-submit-btn',
  deleteBtn: 'admin-produtos-delete-btn',
  emptyState: 'admin-produtos-empty-state',
  row: (id: number | string): string => `admin-produtos-row-${id}`,
  editNomeInput: 'admin-produtos-edit-nome-input',
  editSubmit: 'admin-produtos-edit-submit-btn',
} as const;
