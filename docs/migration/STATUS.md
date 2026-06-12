# Status da migração

> **Agente implementador:** atualize este arquivo ao concluir cada fase.

## Fase atual

| Campo | Valor |
|-------|-------|
| **Fase ativa** | 0 — Fundação |
| **Iniciada em** | — |
| **Concluída em** | — |
| **Responsável** | — |

## Progresso por fase

| Fase | Nome | Status | Data conclusão | Notas |
|------|------|--------|----------------|-------|
| 0 | Fundação | `pending` | — | — |
| 1 | API + auth + tenant | `pending` | — | — |
| 2 | Primeiro admin React | `pending` | — | — |
| 3 | Admin completo | `pending` | — | — |
| 4 | API crítica (checkout) | `pending` | — | — |
| 5 | Vitrine Next (público) | `pending` | — | — |
| 6 | Comprador Next | `pending` | — | — |
| 7 | Drizzle + migrations | `pending` | — | — |
| 8 | Descomissionar legacy | `pending` | — | — |

Status permitidos: `pending` | `in_progress` | `blocked` | `done`

## Métricas

| Métrica | Valor | Meta final |
|---------|-------|------------|
| Rotas Express ativas | 100% | 0% |
| Páginas EJS restantes | 34 | 0 |
| Apps no monorepo | 0 | 3 (api, admin, storefront) |
| Legacy removido | não | sim |
| Telas com data-testid (admin+store) | 0 | 100% das telas React/Next |
| Specs Playwright | 0 | smoke críticos (login, pedidos, checkout) |

## Equipe

| Papel | Envolvimento na migração |
|-------|--------------------------|
| Dev front | UI + testids |
| Dev back | API + testes integração |
| Testador QA | Playwright + catálogo — ver [TESTING-STRATEGY.md](./TESTING-STRATEGY.md) |

## Bloqueios / decisões pendentes

_Nenhum._

## Log de entregas

<!-- Formato: YYYY-MM-DD — Fase N — resumo -->
