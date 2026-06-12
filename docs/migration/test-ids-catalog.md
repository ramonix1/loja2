# Catálogo de data-testid

Registro vivo de seletores para testes E2E (Playwright). **Atualizar ao criar ou alterar telas** (Fase 2+).

Convenção: `{app}-{pagina}-{elemento}[-{id}]` — ver [TESTING-STRATEGY.md](./TESTING-STRATEGY.md).

---

## auth (login compartilhado admin/store)

| data-testid | App | Elemento | Fase | Spec |
|-------------|-----|----------|------|------|
| `auth-login-email-input` | admin | Input e-mail | 2 | admin/login.spec.ts |
| `auth-login-password-input` | admin | Input senha | 2 | admin/login.spec.ts |
| `auth-login-submit-btn` | admin | Botão entrar | 2 | admin/login.spec.ts |
| `auth-login-error-msg` | admin | Erro de credencial | 2 | admin/login.spec.ts |

Constantes: `@lojao/test-utils/test-ids` → `testIds.auth.*`.

---

## admin

| data-testid | Página | Elemento | Fase | Spec |
|-------------|--------|----------|------|------|
| `admin-sidebar-nav` | layout | Nav lateral | 2 | admin/pedidos.spec.ts |
| `admin-dashboard-stats` | dashboard | Container de cards | 2 | admin/login.spec.ts |
| `admin-pedidos-table` | pedidos | Tabela | 2 | admin/pedidos.spec.ts |
| `admin-pedidos-row-{id}` | pedidos | Linha (id dinâmico) | 2 | admin/pedidos.spec.ts |
| `admin-pedidos-empty-state` | pedidos | Estado vazio | 2 | — |
| `admin-pedidos-loading` | pedidos | Loading | 2 | — |
| `admin-pedidos-filter-status` | pedidos | Filtro status | 3 | admin/pedidos.spec.ts |
| `admin-pedidos-view-btn-{id}` | pedidos | Link Ver (dinâmico) | 3 | admin/pedidos.spec.ts |
| `admin-dashboard-recent-orders` | dashboard | Tabela pedidos recentes | 3 | admin/dashboard.spec.ts |
| `admin-dashboard-recent-row-{id}` | dashboard | Linha recente (dinâmico) | 3 | — |
| `admin-dashboard-charts` | dashboard | Container dos gráficos | 3* | admin/dashboard.spec.ts |
| `admin-dashboard-chart-revenue` | dashboard | Gráfico receita (30 dias) | 3* | admin/dashboard.spec.ts |
| `admin-dashboard-chart-status` | dashboard | Gráfico pedidos por status | 3* | — |
| `admin-dashboard-chart-payment` | dashboard | Gráfico formas de pagamento | 3* | — |
| `admin-dashboard-chart-top-products` | dashboard | Gráfico top produtos | 3* | — |
| `admin-dashboard-chart-period-{7d\|30d\|90d}` | dashboard | Botões de período | 3* | admin/dashboard.spec.ts |
| `admin-dashboard-chart-empty` | dashboard | Empty state sem dados | 3* | — |

\* Módulo 13 — gráficos Recharts (melhoria Fase 3, ver `phases/03-admin-modules.md`).

Constantes: `@lojao/test-utils/test-ids` → `testIds.admin.*` (`pedidosRow(id)`, `pedidosViewBtn(id)`, `dashboardRecentRow(id)` são funções).

### admin-pedido-detail (Fase 3)

| data-testid | Página | Elemento | Fase | Spec |
|-------------|--------|----------|------|------|
| `admin-pedido-detail-panel` | pedidos/:id | Container principal | 3 | admin/pedidos.spec.ts |
| `admin-pedido-detail-status-select` | pedidos/:id | Select status | 3 | — |
| `admin-pedido-detail-rastreio-input` | pedidos/:id | Input rastreio | 3 | — |
| `admin-pedido-detail-save-btn` | pedidos/:id | Salvar status | 3 | — |
| `admin-pedido-detail-back-link` | pedidos/:id | Voltar | 3 | — |
| `admin-pedido-detail-items-table` | pedidos/:id | Tabela itens | 3 | admin/pedidos.spec.ts |

Constantes: `testIds.adminPedidoDetail.*`.

### admin-categorias (Fase 3)

| data-testid | Página | Elemento | Fase | Spec |
|-------------|--------|----------|------|------|
| `admin-categorias-table` | categorias | Lista/container | 3 | admin/categorias.spec.ts |
| `admin-categorias-create-btn` | categorias | Botão criar | 3 | admin/categorias.spec.ts |
| `admin-categorias-nome-input` | categorias | Input nome | 3 | admin/categorias.spec.ts |
| `admin-categorias-delete-btn` | categorias | Botão remover | 3 | — |
| `admin-categorias-empty-state` | categorias | Estado vazio | 3 | — |
| `admin-categorias-form-submit-btn` | categorias/:id | Salvar edição | 3 | — |
| `admin-categorias-ordem-input` | categorias/:id | Ordem | 3 | — |
| `admin-categorias-row-{id}` | categorias | Linha (dinâmico) | 3 | — |

Constantes: `testIds.adminCategorias.*` (`row(id)` é função).

### admin-banners (Fase 3)

| data-testid | Página | Elemento | Fase | Spec |
|-------------|--------|----------|------|------|
| `admin-banners-table` | banners | Lista/container | 3 | admin/banners.spec.ts |
| `admin-banners-create-btn` | banners | Botão novo | 3 | — |
| `admin-banners-titulo-input` | banners/novo, :id | Input título | 3 | admin/banners.spec.ts |
| `admin-banners-imagem-input` | banners/novo, :id | Input arquivo | 3 | admin/banners.spec.ts |
| `admin-banners-form-submit-btn` | banners/novo, :id | Salvar | 3 | — |
| `admin-banners-delete-btn` | banners | Excluir | 3 | — |
| `admin-banners-empty-state` | banners | Estado vazio | 3 | — |
| `admin-banners-row-{id}` | banners | Linha (dinâmico) | 3 | — |

Constantes: `testIds.adminBanners.*`.

### admin-aparencia (Fase 3)

| data-testid | Página | Elemento | Fase | Spec |
|-------------|--------|----------|------|------|
| `admin-aparencia-form` | aparencia | Formulário | 3 | admin/aparencia.spec.ts |
| `admin-aparencia-preview` | aparencia | Pré-visualização header | 3 | admin/aparencia.spec.ts |
| `admin-aparencia-nome-input` | aparencia | Input nome | 3 | admin/aparencia.spec.ts |
| `admin-aparencia-slogan-input` | aparencia | Input slogan | 3 | — |
| `admin-aparencia-rodape-input` | aparencia | Input rodapé | 3 | — |
| `admin-aparencia-cor-input` | aparencia | Input cor | 3 | — |
| `admin-aparencia-email-input` | aparencia | Input e-mail | 3 | — |
| `admin-aparencia-whatsapp-input` | aparencia | Input WhatsApp | 3 | — |
| `admin-aparencia-logo-input` | aparencia | Input logo | 3 | — |
| `admin-aparencia-favicon-input` | aparencia | Input favicon | 3 | — |
| `admin-aparencia-form-submit-btn` | aparencia | Salvar | 3 | — |
| `admin-aparencia-success-msg` | aparencia | Mensagem sucesso | 3 | — |

Constantes: `testIds.adminAparencia.*`.

### admin-produtos (Fase 3)

| data-testid | Página | Elemento | Fase | Spec |
|-------------|--------|----------|------|------|
| `admin-produtos-table` | produtos | Tabela/lista | 3 | admin/produtos.spec.ts |
| `admin-produtos-create-form` | produtos | Form criar | 3 | admin/produtos.spec.ts |
| `admin-produtos-nome-input` | produtos | Input nome | 3 | admin/produtos.spec.ts |
| `admin-produtos-valor-input` | produtos | Input valor | 3 | admin/produtos.spec.ts |
| `admin-produtos-imagens-input` | produtos | Input imagens | 3 | admin/produtos.spec.ts |
| `admin-produtos-form-submit-btn` | produtos | Salvar novo | 3 | — |
| `admin-produtos-delete-btn` | produtos | Excluir | 3 | — |
| `admin-produtos-empty-state` | produtos | Estado vazio | 3 | — |
| `admin-produtos-row-{id}` | produtos | Linha (dinâmico) | 3 | — |
| `admin-produtos-edit-nome-input` | produtos/:id | Input nome edição | 3 | — |
| `admin-produtos-edit-submit-btn` | produtos/:id | Salvar edição | 3 | — |

Constantes: `testIds.adminProdutos.*`.

### admin-compradores (Fase 3)

| data-testid | Página | Elemento | Fase | Spec |
|-------------|--------|----------|------|------|
| `admin-compradores-stats` | compradores | Cards de resumo | 3 | admin/compradores.spec.ts |
| `admin-compradores-table` | compradores | Tabela | 3 | admin/compradores.spec.ts |
| `admin-compradores-search-input` | compradores | Input busca | 3 | admin/compradores.spec.ts |
| `admin-compradores-search-btn` | compradores | Botão buscar | 3 | admin/compradores.spec.ts |
| `admin-compradores-search-clear-btn` | compradores | Limpar busca | 3 | — |
| `admin-compradores-empty-state` | compradores | Estado vazio | 3 | — |
| `admin-compradores-row-{id}` | compradores | Linha (dinâmico) | 3 | — |
| `admin-compradores-detail-btn-{id}` | compradores | Link ver ficha | 3 | — |
| `admin-compradores-detail-panel` | compradores/:id | Painel detalhe | 3 | — |
| `admin-compradores-detail-back-btn` | compradores/:id | Voltar | 3 | — |

Constantes: `testIds.adminCompradores.*` (`row(id)`, `detailBtn(id)` são funções).

### admin-configuracoes (Fase 3)

| data-testid | Página | Elemento | Fase | Spec |
|-------------|--------|----------|------|------|
| `admin-configuracoes-form` | configuracoes | Formulário | 3 | admin/configuracoes.spec.ts |
| `admin-configuracoes-form-submit-btn` | configuracoes | Salvar | 3 | admin/configuracoes.spec.ts |
| `admin-configuracoes-success-msg` | configuracoes | Mensagem sucesso | 3 | admin/configuracoes.spec.ts |
| `admin-configuracoes-error-msg` | configuracoes | Mensagem erro | 3 | — |
| `admin-configuracoes-controla-estoque-input` | configuracoes | Toggle estoque | 3 | admin/configuracoes.spec.ts |
| `admin-configuracoes-reservar-estoque-input` | configuracoes | Toggle reserva | 3 | — |
| `admin-configuracoes-habilitar-sumup-input` | configuracoes | Toggle SumUp | 3 | — |
| `admin-configuracoes-modulo-agenda-input` | configuracoes | Toggle agenda | 3 | — |
| `admin-configuracoes-frete-cep-input` | configuracoes | CEP origem | 3 | — |
| `admin-configuracoes-frete-fixo-input` | configuracoes | Frete fixo | 3 | — |
| `admin-configuracoes-melhor-envio-token-input` | configuracoes | Token Melhor Envio | 3 | — |
| `admin-configuracoes-melhor-envio-sandbox-input` | configuracoes | Sandbox ME | 3 | — |

Constantes: `testIds.adminConfiguracoes.*`.

### admin-relatorios (Fase 3)

| data-testid | Página | Elemento | Fase | Spec |
|-------------|--------|----------|------|------|
| `admin-relatorios-panel` | relatorios | Container | 3 | admin/relatorios.spec.ts |
| `admin-relatorios-tabs` | relatorios | Abas | 3 | admin/relatorios.spec.ts |
| `admin-relatorios-tab-{id}` | relatorios | Aba (dinâmico) | 3 | admin/relatorios.spec.ts |
| `admin-relatorios-date-filter` | relatorios | Filtro datas | 3 | — |
| `admin-relatorios-date-inicio-input` | relatorios | Data início | 3 | — |
| `admin-relatorios-date-fim-input` | relatorios | Data fim | 3 | — |
| `admin-relatorios-date-filter-btn` | relatorios | Filtrar | 3 | — |
| `admin-relatorios-csv-export-btn` | relatorios | Exportar CSV | 3 | — |
| `admin-relatorios-table` | relatorios | Tabela/lista | 3 | admin/relatorios.spec.ts |
| `admin-relatorios-empty-state` | relatorios | Estado vazio | 3 | — |
| `admin-relatorios-error-msg` | relatorios | Erro | 3 | — |
| `admin-relatorios-estoque-filter-{filtro}` | relatorios | Filtro estoque | 3 | — |

Constantes: `testIds.adminRelatorios.*` (`tab(id)`, `estoqueFilter(filtro)` são funções).

### admin-agenda (Fase 3)

| data-testid | Página | Elemento | Fase | Spec |
|-------------|--------|----------|------|------|
| `admin-agenda-panel` | agenda | Container | 3 | admin/agenda.spec.ts |
| `admin-agenda-calendar` | agenda | Calendário | 3 | admin/agenda.spec.ts |
| `admin-agenda-calendar-prev-btn` | agenda | Mês anterior | 3 | — |
| `admin-agenda-calendar-next-btn` | agenda | Próximo mês | 3 | admin/agenda.spec.ts |
| `admin-agenda-calendar-month-label` | agenda | Título mês | 3 | — |
| `admin-agenda-config-form` | agenda | Form config | 3 | admin/agenda.spec.ts |
| `admin-agenda-config-capacidade-input` | agenda | Vagas/dia | 3 | — |
| `admin-agenda-config-ant-min-input` | agenda | Ant. mínima | 3 | — |
| `admin-agenda-config-ant-max-input` | agenda | Ant. máxima | 3 | — |
| `admin-agenda-config-save-btn` | agenda | Salvar config | 3 | — |
| `admin-agenda-day-panel` | agenda | Painel dia | 3 | — |
| `admin-agenda-day-capacidade-input` | agenda | Cap. especial | 3 | — |
| `admin-agenda-day-motivo-input` | agenda | Motivo | 3 | — |
| `admin-agenda-day-save-btn` | agenda | Salvar dia | 3 | — |
| `admin-agenda-day-remove-btn` | agenda | Remover especial | 3 | — |
| `admin-agenda-day-{data}` | agenda | Célula dia | 3 | — |
| `admin-agenda-success-msg` | agenda | Sucesso | 3 | — |
| `admin-agenda-error-msg` | agenda | Erro | 3 | — |

Constantes: `testIds.adminAgenda.*` (`dayCell(data)` é função).

### admin-permissoes (Fase 3)

| data-testid | Página | Elemento | Fase | Spec |
|-------------|--------|----------|------|------|
| `admin-permissoes-panel` | permissoes | Container | 3 | admin/permissoes.spec.ts |
| `admin-permissoes-create-form` | permissoes | Form criar | 3 | admin/permissoes.spec.ts |
| `admin-permissoes-nome-input` | permissoes | Nome | 3 | admin/permissoes.spec.ts |
| `admin-permissoes-email-input` | permissoes | Email | 3 | — |
| `admin-permissoes-senha-input` | permissoes | Senha | 3 | — |
| `admin-permissoes-cpf-input` | permissoes | CPF | 3 | — |
| `admin-permissoes-create-btn` | permissoes | Criar | 3 | admin/permissoes.spec.ts |
| `admin-permissoes-table` | permissoes | Tabela | 3 | admin/permissoes.spec.ts |
| `admin-permissoes-empty-state` | permissoes | Vazio | 3 | — |
| `admin-permissoes-row-{id}` | permissoes | Linha | 3 | — |
| `admin-permissoes-toggle-btn-{id}` | permissoes | Suspender/Ativar | 3 | — |
| `admin-permissoes-delete-btn-{id}` | permissoes | Remover | 3 | — |
| `admin-permissoes-success-msg` | permissoes | Sucesso | 3 | — |
| `admin-permissoes-error-msg` | permissoes | Erro | 3 | — |

Constantes: `testIds.adminPermissoes.*` (`row`, `toggleBtn`, `deleteBtn` são funções).

### admin-chat (Fase 3)

| data-testid | Página | Elemento | Fase | Spec |
|-------------|--------|----------|------|------|
| `admin-chat-panel` | chat | Container | 3 | admin/chat.spec.ts |
| `admin-chat-conversas-list` | chat | Lista conversas | 3 | admin/chat.spec.ts |
| `admin-chat-filter-{tipo}` | chat | Filtro (abertas/todas/encerradas) | 3 | — |
| `admin-chat-empty-state` | chat | Sem conversa selecionada | 3 | admin/chat.spec.ts |
| `admin-chat-messages` | chat | Mensagens | 3 | — |
| `admin-chat-input` | chat | Input resposta | 3 | admin/chat.spec.ts |
| `admin-chat-send-btn` | chat | Enviar | 3 | admin/chat.spec.ts |
| `admin-chat-assumir-btn` | chat | Assumir conversa | 3 | — |
| `admin-chat-liberar-bot-btn` | chat | Ativar bot | 3 | — |
| `admin-chat-encerrar-btn` | chat | Encerrar | 3 | — |
| `admin-chat-bot-config-btn` | chat | Config bot | 3 | — |
| `admin-chat-bot-modal` | chat | Modal bot | 3 | — |
| `admin-chat-bot-save-btn` | chat | Salvar bot | 3 | — |
| `admin-chat-conversa-{id}` | chat | Item conversa | 3 | admin/chat.spec.ts |

Constantes: `testIds.adminChat.*` (`filter`, `conversaItem` são funções).

**Socket:** tempo real via Socket.IO no legacy (`VITE_LEGACY_URL`) até Fase 4.

### admin-diagnostico (Fase 3)

| data-testid | Página | Elemento | Fase | Spec |
|-------------|--------|----------|------|------|
| `admin-diagnostico-panel` | diagnostico | Container | 3 | admin/diagnostico.spec.ts |
| `admin-diagnostico-results` | diagnostico | Lista resultados | 3 | admin/diagnostico.spec.ts |
| `admin-diagnostico-item-{nome}` | diagnostico | Item check | 3 | admin/diagnostico.spec.ts |
| `admin-diagnostico-refresh-btn` | diagnostico | Atualizar | 3 | — |
| `admin-diagnostico-help-section` | diagnostico | Ajuda credenciais | 3 | — |
| `admin-diagnostico-config-link` | diagnostico | Link configurações | 3 | — |

Constantes: `testIds.adminDiagnostico.*` (`item(nome)` é função).

---

## store (vitrine / comprador)

| data-testid | Página | Elemento | Fase | Spec |
|-------------|--------|----------|------|------|
| _a definir_ | — | — | 5+ | — |

---

## ui (packages/ui compartilhados)

| data-testid | Componente | Elemento | Fase | Spec |
|-------------|------------|----------|------|------|
| ui-toast-success | Toast | Sucesso | 2+ | — |
| ui-toast-error | Toast | Erro | 2+ | — |

---

## Como adicionar entrada

1. Criar `data-testid` no componente
2. Adicionar linha nesta tabela
3. QA cria/atualiza spec Playwright referenciando o id
