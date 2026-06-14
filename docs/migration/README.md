# Migração Lojão — Guia para agente implementador

Este diretório contém a especificação **spec-driven** para migrar o Lojão de um monolito Express + EJS para um monorepo TypeScript com Fastify (API), React (admin), Next.js (vitrine) e PostgreSQL.

## Público-alvo

Agente de IA (ex.: Claude Fable 5) ou desenvolvedor executando a migração **fase por fase**.

## Leitura obrigatória (nesta ordem)

1. [CONTEXT.md](./CONTEXT.md) — o que é o produto, stack atual, decisões arquiteturais
2. [SPEC.md](./SPEC.md) — protocolo de execução, convenções, definição de pronto
3. [TESTING-STRATEGY.md](./TESTING-STRATEGY.md) — intenção, pirâmide, `data-testid`
4. [TESTING-IMPLEMENTATION.md](./TESTING-IMPLEMENTATION.md) — **como implementar** testes por camada (Playwright, vitest)
5. [DEPLOY.md](./DEPLOY.md) — evolução do Docker, Makefile e produção por fase
6. [STATUS.md](./STATUS.md) — fase atual e checklist de progresso (**atualizar a cada entrega**)
7. A spec da fase ativa em [phases/](./phases/) — seção **「Testes automatizados — como implementar」** em cada fase

## Fases

| Fase | Arquivo | Objetivo |
|------|---------|----------|
| 0 | [phases/00-foundation.md](./phases/00-foundation.md) | Monorepo + legacy intacto + API skeleton |
| 1 | [phases/01-api-auth-tenant.md](./phases/01-api-auth-tenant.md) | Auth + tenant no Fastify |
| 2 | [phases/02-first-admin-react.md](./phases/02-first-admin-react.md) | Primeiro módulo admin React |
| 3 | [phases/03-admin-modules.md](./phases/03-admin-modules.md) | Migrar todo o admin EJS |
| 4 | [phases/04-critical-api.md](./phases/04-critical-api.md) | Checkout, webhooks, billing, chat |
| 5 | [phases/05-storefront-public.md](./phases/05-storefront-public.md) | Vitrine pública Next.js |
| 6 | [phases/06-storefront-buyer.md](./phases/06-storefront-buyer.md) | Carrinho, checkout, área do comprador |
| 7 | [phases/07-drizzle-migrations.md](./phases/07-drizzle-migrations.md) | ORM + migrations formais |
| 8 | [phases/08-decommission-legacy.md](./phases/08-decommission-legacy.md) | Remover Express/EJS |

## Regra de ouro

**Implemente apenas UMA fase por sessão**, salvo instrução explícita do usuário. Não avance para a fase N+1 até todos os critérios de aceite da fase N estarem verificados e `STATUS.md` atualizado.
