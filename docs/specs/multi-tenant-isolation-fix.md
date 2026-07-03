# Correção crítica — Isolamento multi-tenant (database-per-tenant)

**Severidade:** crítica (vazamento/perda de dados entre lojas).
**Data:** 2026-07-01

## Sintoma

Ao selecionar uma loja no admin, o nome mudava corretamente, mas **dashboard, produtos e a vitrine mostravam sempre os dados da mesma loja** (a principal/demo). Pior: um lojista conseguia **ler e apagar dados de outra loja**, sem que a loja dona percebesse.

## Causa raiz

O isolamento multi-tenant existia na resolução do slug, mas **não na camada de dados**:

1. `createTenant` gravava a **mesma** `DATABASE_URL` (host/porta/`db_name`/user/senha) em toda linha de `tenants` → todas as lojas apontavam para o mesmo banco físico.
2. `tenant-db.ts` conectava todo tenant ao mesmo banco (em dev via `DATABASE_URL` único; em produção via `db_name`, idêntico para todos).
3. As tabelas de dados (`produtos`, `pedidos`, `usuarios`, `configuracoes`, …) **não têm coluna `tenant_id`** → nem isolamento por linha existia.

Só `tenants.nome` (banco master) era por-loja — por isso o nome mudava, mas os dados não.

## Correção — database-per-tenant

Cada loja passa a ter um **banco PostgreSQL próprio** (`<db>_<slug>`) no mesmo servidor da `DATABASE_URL` (viável no Render: vários bancos no mesmo instance, mesmo host/credenciais, só muda o nome do banco).

Arquivos:

| Arquivo | Mudança |
|---------|---------|
| `apps/api/src/lib/tenant-provision.ts` (novo) | Estratégia (`database`/`shared`), nome do banco por loja, `CREATE DATABASE` idempotente + migrations, derivação da conexão a partir da `DATABASE_URL` |
| `apps/api/src/lib/tenant-db.ts` | Pool por loja usando o **banco próprio** (`db_name`); invalida cache Drizzle junto com o pool; limite `TENANT_POOL_MAX` |
| `apps/api/src/modules/platform/platform.service.ts` | `createTenant` provisiona o banco isolado da loja antes de registrar o tenant |
| `apps/api/src/lib/bootstrap.ts` | `repairTenantIsolation`: no boot, isola lojas legadas que ainda compartilhavam o banco (idempotente) |

### Estratégia

- `TENANT_DB_STRATEGY=database` (padrão fora de testes) — isolamento real.
- `shared` — usado **só em testes** (o seed cria um único banco); não altera o comportamento de produção.

### Dados existentes — **superado (greenfield MA)**

Decisão revogada em 2026-07-01. Não preservar demo nem mapa de contas. Cutover MA = reset de banco + signup na arquitetura nova. Ver [merchant-account-architecture-spec.md](./merchant-account-architecture-spec.md) §7.

## Verificação

- `apps/api/tests/integration/tenant.isolation.test.ts` (novo): cria duas lojas com bancos próprios e prova que **dados não vazam** e que **apagar em uma não afeta a outra**.
- Suíte API: **163/163** verdes (estratégia `shared` em testes preserva o seed existente).
- Typecheck: ✓.

## Interim vs alvo (MA)

Fix **temporário** até cutover **MA8 greenfield**. Arquitetura final: **1 banco por merchant** + N lojas (`store_id`). Código database-per-store e `repairTenantIsolation` serão **removidos** — não evoluir.

Nomenclatura: [naming-policy.md](./naming-policy.md).

## Operação (interim only)

- **Automático:** reparo no boot (legado; removido em MA9).
- **Pré-requisito:** Postgres com `CREATE DATABASE`.
- **Rollback interim:** `TENANT_DB_STRATEGY=shared` — **não recomendado** (reabre vazamento).
