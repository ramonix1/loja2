# Runbook — migrations Drizzle (Fase 7)

## Visão geral

- Pacote: `packages/db` (`@lojao/db`)
- Migrations: `packages/db/drizzle/` — **31 arquivos granulares** (extensões, master, billing, tenant, webhooks)
- Ordem e journal: `packages/db/drizzle/meta/_journal.json`
- Novas alterações de banco: **somente** via `drizzle-kit generate` + `db:migrate`
- Multi-tenant: **opção A** — instância Drizzle por tenant (cache por slug), compatível com `tenants` + `getPool(slug)`

### Estrutura das migrations iniciais

| Prefixo | Conteúdo |
|---------|----------|
| `0000_extensions` | `pgcrypto` |
| `0001`–`0004` | Master: `tenants`, `sessao`, `platform_config`, `leads` |
| `0005`–`0008` | Billing: `billing_plans`, `tenant_billing`, `invoices`, `commission_transactions` |
| `0009`–`0029` | Tenant: uma migration por tabela (usuários, produtos, pedidos, chat, etc.) |
| `0030_webhook_events` | Idempotência de webhooks |

Todas usam `IF NOT EXISTS` / `ON CONFLICT DO NOTHING` — seguras em banco já provisionado.

## Comandos

```bash
# Aplicar migrations (dev/CI)
make db-migrate
# ou
pnpm --filter @lojao/db db:migrate

# Gerar migration após editar schema em packages/db/src/schema/
make db-generate

# Inspecionar dados
make db-studio
```

## Fluxo para nova migration

1. Editar arquivos em `packages/db/src/schema/master/` ou `tenant/`
2. `make db-generate` — cria SQL em `packages/db/drizzle/`
3. Revisar SQL gerado (proibido DROP/rename sem doc + backup)
4. `make db-migrate`
5. `pnpm --filter api test` + `pnpm test:e2e:smoke`

## Banco limpo (dev)

```bash
make reset          # apaga volume Postgres
make up-d           # sobe db + api + legacy
make db-migrate     # cria todas as tabelas
make seed           # popula tenant loja (api seed:dev)
```

O bootstrap da API aplica migrations no boot; a baseline Drizzle é **idempotente** (`IF NOT EXISTS`).

## Bancos que já rodaram `0000_baseline` (legado)

Se `drizzle.__drizzle_migrations` contém apenas o registro antigo `0000_baseline`:

- **Dev:** `make db-reset && make db-up-d` (recomendado)
- **Produção / dados preservados:** rodar `make db-migrate` — as 31 migrations novas executam com `IF NOT EXISTS` e registram entradas adicionais no journal; o registro órfão de `0000_baseline` pode permanecer sem impacto funcional

## Módulos API migrados para Drizzle (Fase 7)

| Módulo | Funções |
|--------|---------|
| auth | `login`, `register`, `recoverPassword`, `resetPassword`, `isResetTokenValid` |
| public | `listPublicProducts`, `getPublicProductById` |
| admin | `listPedidos` |

Demais rotas permanecem em `pool.query()` até migração gradual.

## Produção

- **Não** rodar migrate automaticamente no boot da API em produção
- Step de deploy: `pnpm --filter @lojao/db db:migrate` antes de subir nova versão
- Backup obrigatório antes de migrations destrutivas (proibidas sem runbook dedicado)

## Testes

```bash
pnpm --filter @lojao/db test     # migrate baseline + tabelas
pnpm --filter api test           # regressão API
pnpm test:e2e:smoke              # regressão UI
```

## Rollback

Migrations iniciais não alteram dados existentes. Para reverter uma migration futura:

1. Restaurar backup do Postgres
2. Ou criar migration compensatória (preferível a editar migration já aplicada)
