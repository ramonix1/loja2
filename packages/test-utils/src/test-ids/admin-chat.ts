/** data-testid do módulo admin Chat (Fase 3). */
export const adminChat = {
  panel: 'admin-chat-panel',
  conversasList: 'admin-chat-conversas-list',
  filter: (tipo: string): string => `admin-chat-filter-${tipo}`,
  emptyState: 'admin-chat-empty-state',
  messages: 'admin-chat-messages',
  input: 'admin-chat-input',
  sendBtn: 'admin-chat-send-btn',
  assumirBtn: 'admin-chat-assumir-btn',
  liberarBotBtn: 'admin-chat-liberar-bot-btn',
  encerrarBtn: 'admin-chat-encerrar-btn',
  botConfigBtn: 'admin-chat-bot-config-btn',
  botModal: 'admin-chat-bot-modal',
  botSaveBtn: 'admin-chat-bot-save-btn',
  conversaItem: (id: number): string => `admin-chat-conversa-${id}`,
} as const;
