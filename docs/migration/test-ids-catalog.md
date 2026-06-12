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

Constantes: `@lojao/test-utils/test-ids` → `testIds.admin.*` (`pedidosRow(id)` é função).

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
