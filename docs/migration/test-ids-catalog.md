# Catálogo de data-testid

Registro vivo de seletores para testes E2E (Playwright). **Atualizar ao criar ou alterar telas** (Fase 2+).

Convenção: `{app}-{pagina}-{elemento}[-{id}]` — ver [TESTING-STRATEGY.md](./TESTING-STRATEGY.md).

---

## auth (login compartilhado admin/store)

| data-testid | App | Elemento | Fase | Spec |
|-------------|-----|----------|------|------|
| _a definir_ | — | — | 2+ | — |

---

## admin

| data-testid | Página | Elemento | Fase | Spec |
|-------------|--------|----------|------|------|
| _a definir_ | — | — | 2+ | — |

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
