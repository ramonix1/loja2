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

- **Node.js 24+** e **pnpm 10+** (`corepack enable`) — desenvolvimento no host
- **Docker** + **Docker Compose** — apenas para o **Postgres** no dia a dia; stack completa só para CI ou quem preferir containers

---

## Desenvolvimento (padrão: híbrido)

**Postgres no Docker** + **api, admin e storefront no host**.

### Terminais separados (recomendado)

Um app por terminal — logs limpos, sem mistura:

```bash
make db-up-d        # terminal 0: Postgres (uma vez)

# terminal 1          terminal 2           terminal 3
make dev-api        make dev-admin       make dev-storefront
# :3001               :5173                :3000
```

Atalhos `pnpm`: `pnpm dev:api`, `pnpm dev:admin`, `pnpm dev:storefront`.

Suba a **API primeiro** (migrations + bootstrap no boot). Depois admin e storefront.

### Um terminal só (alternativa)

```bash
make dev-all        # turbo — logs misturados
make dev-ui         # turbo com painéis (TUI) no mesmo terminal
```

Setup inicial:

```bash
make hybrid-setup   # 1ª vez: limpa deps + Postgres + pnpm install
make seed           # dados demo (após API no ar)
```

Fluxo manual equivalente:

```bash
make db-up-d
cp .env.example .env   # se ainda não tiver .env
pnpm install
# abra 3 terminais com dev:api / dev:admin / dev:storefront
```

> **`.env` na raiz:** `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lojao`, `PGSSL=disable`, `API_URL=http://localhost:3001`.

### ⚠️ Não misture modos

| Faça | Não faça no híbrido |
|------|---------------------|
| `make db-up-d` + `make dev-api` / `dev-admin` / `dev-storefront` | `make up-d` (stack completa) |
| `pnpm install` no host | `make deps-sync` / `make api-install` (só Docker) |

Se você rodou `make up-d` antes, o Docker pode deixar pastas como **root** (`node_modules`, `.next`, `dist`, `.turbo`) e o `pnpm`/`next` falham. Corrija com:

```bash
make clean-host    # ou: make hybrid-setup
pnpm install
```

---

## Docker completo (opcional)

Para onboarding rápido, espelhar CI local ou quem não quer Node no host. **Não use junto com `pnpm dev`.**

```bash
make up-d
make seed
```

---

## Acessos (ambos os modos)

- **Vitrine:** http://localhost:3000/
- **Admin React:** http://localhost:5173/admin/dashboard
- **API health:** http://localhost:3001/health

Proxy unificado (só Docker completo): `make up-proxy` → http://localhost:8080/

Credenciais dev (auto-provision + seed): **admin@loja.com / admin123**

Comandos úteis: `make help`, `make db-down`, `make db-reset`, `make clean-host`.

> **Artefatos no host (só Docker completo):** evite `make up-d` se desenvolve no host — use `make clean-host` para recuperar permissões (`.next`, `dist`, `node_modules`, etc.).

---

## Seed de desenvolvimento

```bash
make seed          # idempotente — funciona nos dois modos
make seed-fresh    # recria dados [DEV]
```

| Papel | E-mail | Senha |
|-------|--------|-------|
| Admin | admin@loja.com | admin123 |
| Comprador | comprador-test@loja.com | comprador123 |
| Comprador | maria.silva@email.com | comprador123 |
| Comprador | joao.santos@email.com | comprador123 |

Atalhos: `pnpm seed` / `pnpm seed:fresh`.

---

## Migrations e banco

```bash
make db-migrate     # Drizzle baseline + futuras (host ou container)
make db-generate    # após editar schema em packages/db
make db-studio      # inspecionar dados
make db             # psql (stack completa ou db-up-d)
```

Banco limpo:

- **Docker completo:** `make reset && make up-d && make db-migrate && make seed`
- **Híbrido:** `make db-reset && make db-up-d && pnpm dev` (migrations no boot da API) `&& make seed`

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

Uploads de imagem: provider `local` (disco, default) ou `r2` (Cloudflare R2). Ver [`docs/api-dependency-inversion.md`](docs/api-dependency-inversion.md).

- **Local (dev híbrido, default):** arquivos em `data/uploads/images/`; a API serve em `http://localhost:3001/images/...`; a vitrine faz proxy em `http://localhost:3000/images/...` → API. **A API precisa estar no ar** para as imagens carregarem no browser.
- **R2:** só quando `STORAGE_PROVIDER=r2` no `.env` (produção ou teste explícito).
- **Veio do Docker completo?** Imagens antigas podem estar no volume Docker — copie com `make migrate-uploads-from-docker`.

---

## Testes

```bash
make test-api           # vitest API (requer Postgres — db-up-d ou stack)
make test-e2e-smoke     # Playwright @smoke (requer stack ou pnpm dev + seed)
pnpm test:all           # API + smoke E2E (gate release)
make deploy-check       # typecheck + api test + build
```

E2E: instale o browser uma vez — `pnpm --filter e2e exec playwright install chromium`.

Detalhes: [`apps/e2e/README.md`](apps/e2e/README.md).

---

## Variáveis principais

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` | Postgres (`localhost:5432` no híbrido; `db:5432` só dentro de containers) |
| `PGSSL` | `disable` em dev (híbrido e Docker local) |
| `SESSION_SECRET` | Cookie `lojao.sid` |
| `TENANT_SLUG` | Tenant dev (`loja`) |
| `API_URL` | SSR storefront → API (`http://localhost:3001` no híbrido) |
| `UPLOAD_DIR` | Pasta de imagens quando `STORAGE_PROVIDER=local` |
| `STORAGE_PROVIDER` | `local` ou `r2` (Cloudflare R2) |
| `R2_*` | Credenciais e URL pública do bucket R2 |
| `VITE_API_URL` / `NEXT_PUBLIC_API_URL` | URL da API no browser |

Copie `.env.example` → `.env` e ajuste conforme necessário.

---

## Deploy Render (Blueprint)

Monorepo pronto para **Render Blueprint** (`render.yaml` na raiz).

**Antes de push/deploy:** `make ci-install && make deploy-check` — o Render usa `pnpm install --frozen-lockfile` (dev local não). Produção usa `STORAGE_PROVIDER=r2`; dev híbrido usa `local`.

1. Render → **New → Blueprint** → repo + branch `master`
2. Suspenda/apague o serviço legado que usava `server.js`
3. Preencha secrets no dashboard (`ADMIN_SENHA`, Stripe, e-mail, etc.)

Runbook completo: [`docs/migration/runbooks/render-blueprint.md`](docs/migration/runbooks/render-blueprint.md)

---

## Migração (histórico)

A migração Strangler Fig (Express/EJS → monorepo TS) concluiu na **Fase 8**. Specs e status em [`docs/migration/`](docs/migration/).
