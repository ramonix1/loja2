# Fase 7 — Drizzle ORM + migrations formais

| Campo | Valor |
|-------|-------|
| **ID** | `phase-7` |
| **Depende de** | Fase 4 `done` |
| **Duração estimada** | 3–4 semanas (overlap Fase 5–6) |
| **Deploy** | [DEPLOY.md § Fase 7](../DEPLOY.md#fase-7--drizzle) |

---

## Objetivo

Introduzir **Drizzle ORM** espelhando schema PostgreSQL existente. Novas alterações de banco **somente** via migrations. Substituir `pool.query()` raw na API gradualmente.

---

## Escopo

### IN

- [ ] `packages/db/` com Drizzle + drizzle-kit
- [ ] Schema master: `tenants`, `sessao`, tabelas billing (`billing_plans`, `tenant_billing`, `invoices`, `commission_transactions`)
- [ ] Schema tenant: espelhar `config/tenantSchema.js` (usuarios, produtos, pedidos, etc.)
- [ ] Baseline migration (`drizzle-kit pull` ou SQL introspect) — **sem alterar dados**
- [ ] Scripts package.json:
  - `db:generate`, `db:migrate`, `db:studio`
- [ ] Makefile: `db-migrate`, `db-generate`, `db-studio`
- [ ] Migrar **pelo menos** módulos api:
  - auth (usuarios)
  - produtos públicos
  - pedidos admin list
- [ ] Documentar processo de nova migration

### OUT

- RLS PostgreSQL (futuro)
- Renomear colunas/tabelas
- Remover SQL raw de todo legacy (legacy será removido Fase 8)

---

## Estratégia

1. **Introspect** banco dev atual → schema Drizzle
2. Revisar manualmente tipos e relations
3. Baseline migration marcada como applied
4. Novos campos: alter table via drizzle-kit generate
5. API usa `@lojao/db` exports; tenant pool via drizzle + postgres.js ou pg adapter

### Multi-tenant com Drizzle

Opções (escolher uma e documentar):

**A)** Drizzle instance por tenant (cache por slug) — espelha `getPool(slug)` atual  
**B)** Schema PostgreSQL por tenant — se já usado  

Manter compatível com registro em `tenants` table.

---

## packages/db estrutura

```
packages/db/
  src/
    schema/
      master/
        tenants.ts
        sessao.ts
        billing.ts
      tenant/
        usuarios.ts
        produtos.ts
        pedidos.ts
        ...
    client.ts
    index.ts
  drizzle/
    0000_baseline.sql
  drizzle.config.ts
  package.json
```

---

## Critérios de aceite (DoD)

- [ ] `pnpm db:migrate` roda clean em banco dev vazio + seed tenant
- [ ] API modules migrados passam testes existentes
- [ ] Nenhuma migration destrutiva sem backup documentado
- [ ] Tipos exportados consumidos em `packages/types` ou re-export drizzle
- [ ] Guia `docs/migration/runbooks/db-migration.md` criado
- [ ] STATUS.md: Fase 7 → `done`

---

## Testes automatizados — como implementar

### Escopo

| Tipo | Ação |
|------|------|
| Testes migrate | **Obrigatório** — apply baseline em db limpo |
| E2E UI | **Regressão** — rodar `pnpm test:e2e:smoke` após migrate |
| data-testid | Sem mudança (já nas UIs) |

### Casos API/db

```
packages/db/tests/migrate.test.ts   # ou apps/api/tests/integration/db.migrate.test.ts
```

| Caso | Assert |
|------|--------|
| `db:migrate` em banco vazio | todas tabelas master + tenant existem |
| Seed mínimo pós-migrate | login admin funciona |
| API tests Fase 1–4 | passam sem alteração |

### Pronto para o testador

- Smoke E2E inalterado após migrate
- Notificar QA se seed/credenciais mudarem

---

## Verificação

```bash
make reset && make up-d    # banco limpo
pnpm --filter @lojao/db db:migrate
pnpm --filter api test
# Verificar tenant auto-provision ainda funciona ou script seed documentado
```

---

## Handoff Fase 8

- % SQL raw restante na api
- Legacy ainda usa pg direto (ok — será removido)
