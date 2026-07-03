# Runbook — MA8 Cutover Greenfield

> Initiative **merchant-account** — fase MA8. Spec: [merchant-account-architecture-spec.md](../specs/merchant-account-architecture-spec.md)

## Objetivo

Substituir o modelo legado `tenants` / database-per-store pelo modelo **conta merchant → N lojas** com banco físico `atacommerce_<merchant_slug>` e `store_id` nas queries. **Sem migração de dados** — clientes recadastram.

## Pré-requisitos

- MA0–MA7 concluídas (primitivos merchant account + billing)
- Backup completo do Postgres legado (opcional, arquivo frio — **não** importar na stack nova)
- Janela de manutenção acordada (se produção com tráfego)

## Dev local — reset greenfield

```bash
# 1. Apagar volume Postgres
make db-reset          # híbrido
# ou
make reset             # stack Docker completa

# 2. Subir Postgres
make db-up-d

# 3. Migrations (0000…0005 — 0005 dropa tabelas legado PT do master)
make db-migrate

# 4. Variáveis de bootstrap (opcional — merchant demo)
export BOOTSTRAP_MERCHANT_SLUG=demo
export BOOTSTRAP_STORE_SLUG=loja
export ADMIN_EMAIL=admin@loja.com
export ADMIN_SENHA=admin123

# 5. Subir API (bootstrap roda migrations + seed demo se configurado)
pnpm dev:api

# 6. Ou signup manual
curl -X POST http://localhost:3001/api/v1/public/merchant-signup \
  -H 'Content-Type: application/json' \
  -d '{
    "merchant": {"slug":"rogerio","name":"Rogério Ltda"},
    "owner": {"name":"Rogério","email":"rogerio@email.com","password":"senha12345"},
    "store": {"slug":"camisetas","name":"Camisetas"},
    "plan": "starter"
  }'
```

## Produção — cutover

1. **Comunicar** janela; colocar apps em manutenção se necessário
2. **Backup** Postgres inteiro (`pg_dump`) — rollback = restore completo + deploy commit anterior
3. **Reset** banco master: `DROP DATABASE` + recriar + `runMigrations()`
4. **Remover** bancos físicos legados (`lojao_*`, tenants isolados) — `DROP DATABASE`
5. **Deploy** API + admin + storefront com código MA8+
6. **Platform admin**: `MASTER_EMAIL` / `MASTER_PASSWORD` no env (sem tabela `usuarios`)
7. **Signup** self-service = único onboarding (`/public/merchant-signup`)
8. **Smoke QA**: signup → login → select-store → dashboard admin → vitrine `/store/{slug}`

## Rollback

- Restaurar backup **inteiro** do Postgres legado
- Deploy do commit **anterior** ao cutover MA8
- Janela recomendada: máx. **7 dias** (spec §7)
- **Não** existe rollback parcial (sem convivência `tenants` + `merchants`)

## Variáveis de ambiente (MA8)

| Variável | Uso |
|----------|-----|
| `BOOTSTRAP_MERCHANT_SLUG` | Slug da conta demo criada no boot |
| `BOOTSTRAP_STORE_SLUG` | Slug da loja demo (default = merchant slug) |
| `BOOTSTRAP_MERCHANT_NAME` | Nome exibido da conta demo |
| `BOOTSTRAP_STORE_NAME` | Nome da loja demo |
| `ADMIN_EMAIL` / `ADMIN_SENHA` | Owner da conta demo |
| `MASTER_EMAIL` / `MASTER_PASSWORD` | Platform Hub (env only) |

**Removidas / obsoletas (MA9 limpa código):**

- `TENANT_SLUG`, `BOOTSTRAP_TENANT_SLUGS`, `VITE_TENANT_SLUG`
- `TENANT_DB_STRATEGY`

## Headers API (MA8)

| Antes | Depois |
|-------|--------|
| `X-Tenant-Slug` | `X-Store-Slug` |
| `tenantSlug` no login body | `storeSlug` (comprador) ou omitir (conta merchant) |

## Critérios de aceite MA8

- [ ] `make db-reset && make db-migrate` — master sem `tenants`/`produtos` PT
- [ ] Signup merchant cria `atacommerce_*` + loja #1 + trial billing
- [ ] Login merchant O(1) + select-store + admin dashboard
- [ ] Vitrine `/store/{slug}` isolada por `store_id`
- [ ] Checkout + webhook comissão via `recordCommissionOnMerchantOrder`
- [ ] `pnpm turbo typecheck` ✓
- [ ] `pnpm --filter api test` ✓ (seed greenfield)

## Próximo: MA9

Remover código morto: `tenant-db.ts`, `plugins/tenant.ts`, `schema/tenant/`, referências residuais a `tenants`.
