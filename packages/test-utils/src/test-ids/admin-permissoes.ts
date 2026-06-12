/** data-testid do módulo admin Permissões (Fase 3). */
export const adminPermissoes = {
  panel: 'admin-permissoes-panel',
  createForm: 'admin-permissoes-create-form',
  nomeInput: 'admin-permissoes-nome-input',
  emailInput: 'admin-permissoes-email-input',
  senhaInput: 'admin-permissoes-senha-input',
  cpfInput: 'admin-permissoes-cpf-input',
  createBtn: 'admin-permissoes-create-btn',
  table: 'admin-permissoes-table',
  emptyState: 'admin-permissoes-empty-state',
  row: (id: number): string => `admin-permissoes-row-${id}`,
  toggleBtn: (id: number): string => `admin-permissoes-toggle-btn-${id}`,
  deleteBtn: (id: number): string => `admin-permissoes-delete-btn-${id}`,
  successMsg: 'admin-permissoes-success-msg',
  errorMsg: 'admin-permissoes-error-msg',
} as const;
