# AGENTS.md — Instruções para agente implementador

Você está migrando o **Lojão** para monorepo TypeScript. Leia isto antes de qualquer código.

## Start here

1. `docs/migration/STATUS.md` — qual fase executar
2. `docs/migration/phases/XX-*.md` — spec da fase
3. `.cursor/rules/lojao-migration.mdc` — regras invioláveis

## Comportamento esperado

- **Uma fase por sessão** salvo pedido explícito do usuário
- Marcar fase `in_progress` ao iniciar em STATUS.md
- Ao terminar: verificar DoD, marcar `done`, escrever log de entrega
- Não pular fases
- Não expandir escopo

## Stack alvo

| App | Tech |
|-----|------|
| apps/api | Fastify + TS + Zod |
| apps/admin | React + Vite |
| apps/storefront | Next.js 15 |
| apps/legacy | Express (temporário) |
| packages/db | Drizzle (Fase 7+) |
| e2e | Playwright (QA + CI) |

## Testes

- Estratégia: `docs/migration/TESTING-STRATEGY.md`
- Implementação: `docs/migration/TESTING-IMPLEMENTATION.md`
- **Cada fase:** seção「Testes automatizados — como implementar」em `docs/migration/phases/`
- UI nova: `data-testid` + specs Playwright mínimos; **legacy EJS: excluído**
- Catálogo: `docs/migration/test-ids-catalog.md`

## Produto

SaaS e-commerce multi-tenant BR. PostgreSQL. Cookie sessão `lojao.sid`. Não quebrar pagamentos.

## Deploy

Toda fase que altera infra deve atualizar:
- `docker-compose.yml`
- `Makefile`
- `LEIA-ME.md`
- `.env.example`

Detalhes: `docs/migration/DEPLOY.md`

## Verificação mínima sempre

```bash
pnpm install
make test          # legacy até Fase 8
pnpm turbo typecheck
```

## Contato humano

Se spec ambígua: documentar assumção em STATUS.md e prosseguir com opção mais conservadora (menor risco, legacy intacto).
