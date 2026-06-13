# Arquitetura — Lojão v2

Monorepo SaaS e-commerce **multi-tenant** (PostgreSQL, slug por loja). Stack pós-migração (Fase 8): sem Express/EJS legacy.

## Diagrama

```
                    ┌─────────────┐
   Browser ────────►│ Caddy/nginx │  (opcional dev :8080)
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │ storefront │  │   admin    │  │    api     │
    │  Next.js   │  │ React/Vite │  │  Fastify   │
    │   :3000    │  │   :5173    │  │   :3001    │
    └──────┬─────┘  └────────────┘  └──────┬─────┘
           │                                │
           └────────────────┬───────────────┘
                            ▼
                    ┌──────────────┐
                    │  PostgreSQL  │
                    │  (tenants +  │
                    │   sessao)    │
                    └──────────────┘
```

## Apps

| App | Pasta | Stack | Porta dev |
|-----|-------|-------|-----------|
| API | `apps/api` | Fastify + TypeScript + Zod | 3001 |
| Admin | `apps/admin` | React 19 + Vite + TanStack Query | 5173 |
| Storefront | `apps/storefront` | Next.js 15 App Router | **3000** |
| E2E | `apps/e2e` | Playwright (QA) | — |

## Packages

| Package | Função |
|---------|--------|
| `@lojao/db` | Drizzle ORM, schema master+tenant, migrations |
| `@lojao/types` | Tipos compartilhados |
| `@lojao/ui` | Componentes React admin |
| `@lojao/test-utils` | test-ids + fixtures Playwright |

## Fluxo multi-tenant

1. Cliente envia header `X-Tenant-Slug` (ou subdomínio em produção).
2. API consulta tabela `tenants` no banco master.
3. Pool PostgreSQL do tenant é resolvido por slug (`tenant-db.ts`); Drizzle cache por slug (`getCachedTenantDb`).
4. Sessão compartilhada via cookie `lojao.sid` na tabela `sessao`.

## Rotas (proxy produção)

| Path | Destino |
|------|---------|
| `/api/*` | API :3001 |
| `/webhook/*` | API :3001 |
| `/socket.io` | API :3001 |
| `/images/*` | API :3001 (uploads estáticos) |
| `/admin/*` | Admin static ou :5173 dev |
| `/*` | Storefront :3000 |

## Banco de dados

- **Migrations:** `packages/db` + `make db-migrate`
- **Bootstrap dev:** API aplica migrations + auto-provision do tenant (`TENANT_SLUG`) no boot
- **Seed demo:** `make seed` → `apps/api/scripts/seed-dev.mjs`

## Deploy desenvolvimento

```bash
make up-d          # api + admin + storefront + db
make seed          # dados demo (idempotente)
make up-proxy      # + Caddy :8080
```

## Deploy produção (referência)

| Serviço | Sugestão |
|---------|----------|
| api | Web service Node (Fastify) |
| storefront | Web service Next SSR |
| admin | Static CDN ou `/admin` no proxy |
| db | Postgres gerenciado |
| proxy | Caddy / nginx / Cloudflare |

Variáveis críticas: `DATABASE_URL`, `SESSION_SECRET`, webhooks em `https://api.<domínio>/webhook/*`.

## Testes

| Comando | Escopo |
|---------|--------|
| `pnpm --filter api test` | Vitest integração API |
| `pnpm test:e2e:smoke` | Playwright @smoke (admin + comprador) |
| `pnpm test:all` | API + smoke E2E (gate CI) |
| `make deploy-check` | typecheck + api test + build |

## Documentação relacionada

- Migração (histórico): [`docs/migration/README.md`](migration/README.md)
- Migrations DB: [`docs/migration/runbooks/db-migration.md`](migration/runbooks/db-migration.md)
- Instalação: [`LEIA-ME.md`](../LEIA-ME.md)
