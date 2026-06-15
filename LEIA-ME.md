# 🛒 Lojão — Guia de Instalação

Plataforma SaaS de e-commerce multi-tenant. **Monorepo** (pnpm + Turborepo):

| App | Stack | Porta |
|-----|-------|-------|
| `apps/api` | Fastify + TypeScript | **3001** |
| `apps/admin` | React 19 + Vite + Tailwind 4 | **5173** |
| `apps/storefront` | Next.js 15 (vitrine + comprador) | **3000** |

Arquitetura completa: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Pré-requisitos

- **Docker** + **Docker Compose** (recomendado)
- Fora do Docker: **Node.js 24+** e **pnpm 10+** (`corepack enable`)

---

## Início rápido (Docker)

```bash
make up-d          # api + admin + storefront + db (background)
make seed          # dados demo (idempotente)
```

Acesse:

- **Vitrine:** http://localhost:3000/
- **Admin React:** http://localhost:5173/admin/dashboard
- **API health:** http://localhost:3001/health

Proxy unificado (opcional): `make up-proxy` → http://localhost:8080/

Credenciais dev (auto-provision + seed): **admin@loja.com / admin123**

Comandos úteis: `make help`, `make logs`, `make logs-api`, `make down`, `make reset`.

> **Volumes `node_modules`:** cada serviço sincroniza deps no boot. Após `pnpm add`: `make deps-sync` ou `make api-install`.

---

## Seed de desenvolvimento

```bash
make up-d
make seed          # idempotente
make seed-fresh    # recria dados [DEV]
```

| Papel | E-mail | Senha |
|-------|--------|-------|
| Admin | admin@loja.com | admin123 |
| Comprador | comprador-test@loja.com | comprador123 |
| Comprador | maria.silva@email.com | comprador123 |
| Comprador | joao.santos@email.com | comprador123 |

Fora do Docker: `pnpm seed` ou `pnpm seed:fresh`.

---

## Migrations e banco

```bash
make db-migrate     # Drizzle baseline + futuras
make db-generate    # após editar schema em packages/db
make db-studio      # inspecionar dados
```

Banco limpo: `make reset && make up-d && make db-migrate && make seed`.

Runbook: [`docs/migration/runbooks/db-migration.md`](docs/migration/runbooks/db-migration.md).

A API aplica migrations e provisiona o tenant (`TENANT_SLUG`) automaticamente no boot.

---

## API (`/api/v1`)

Sessão via cookie `lojao.sid` (tabela `sessao`). Exemplo:

```bash
curl -c cookies.txt -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" -H "X-Tenant-Slug: loja" \
  -d '{"email":"admin@loja.com","senha":"admin123"}'

curl -b cookies.txt http://localhost:3001/api/v1/auth/me \
  -H "X-Tenant-Slug: loja"
```

Uploads de imagem ficam em `data/uploads/images` e são servidos em `http://localhost:3001/images/...`.

---

## Testes

```bash
make test-api           # vitest API (requer Postgres)
make test-e2e-smoke       # Playwright @smoke (requer stack + chromium)
pnpm test:all           # API + smoke E2E (gate release)
make deploy-check       # typecheck + api test + build
```

E2E: instale o browser uma vez — `pnpm --filter e2e exec playwright install chromium`.

Detalhes: [`apps/e2e/README.md`](apps/e2e/README.md).

---

## Desenvolvimento local (sem Docker)

```bash
pnpm install
pnpm --filter api dev         # :3001
pnpm --filter admin dev       # :5173
pnpm --filter storefront dev  # :3000
```

Configure `.env` a partir de `.env.example` (`DATABASE_URL`, `SESSION_SECRET`, `TENANT_SLUG`).

---

## Variáveis principais

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` | Postgres |
| `SESSION_SECRET` | Cookie `lojao.sid` |
| `TENANT_SLUG` | Tenant dev (`loja`) |
| `UPLOAD_DIR` | Pasta de imagens (default `data/uploads/images`) |
| `VITE_API_URL` / `NEXT_PUBLIC_API_URL` | URL da API no browser |

Copie `.env.example` → `.env` e ajuste conforme necessário.

---

## Deploy Render (Blueprint)

Monorepo pronto para **Render Blueprint** (`render.yaml` na raiz):

1. Render → **New → Blueprint** → repo + branch `master`
2. Suspenda/apague o serviço legado que usava `server.js`
3. Preencha secrets no dashboard (`ADMIN_SENHA`, Stripe, e-mail, etc.)

Runbook completo: [`docs/migration/runbooks/render-blueprint.md`](docs/migration/runbooks/render-blueprint.md)

---

## Migração (histórico)

A migração Strangler Fig (Express/EJS → monorepo TS) concluiu na **Fase 8**. Specs e status em [`docs/migration/`](docs/migration/).
