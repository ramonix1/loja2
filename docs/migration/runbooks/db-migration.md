# Runbook — migrations Drizzle (Fase 7)

## Visão geral

- Pacote: `packages/db` (`@lojao/db`)
- Baseline: `packages/db/drizzle/0000_baseline.sql` — espelha schema legacy **sem alterar dados**
- Novas alterações de banco: **somente** via `drizzle-kit generate` + `db:migrate`
- Multi-tenant: **opção A** — instância Drizzle por tenant (cache por slug), compatível com `tenants` + `getPool(slug)`

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

O legacy `init-db.js` / `tenantSchema.js` continuam funcionando em paralelo até Fase 8; a baseline Drizzle é **idempotente** (`IF NOT EXISTS`).

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

Baseline não altera dados existentes. Para reverter uma migration futura:

1. Restaurar backup do Postgres
2. Ou criar migration compensatória (preferível a editar migration já aplicada)
