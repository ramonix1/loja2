# Deploy e infraestrutura — evolução por fase

Documento para o agente implementador e para ops. Descreve **como o ambiente sobe hoje** e **o que muda em cada fase**.

---

## Estado atual (pré-migração)

### docker-compose.yml

| Serviço | Imagem/build | Porta | Comando |
|---------|--------------|-------|---------|
| `app` | `Dockerfile` (Node 24 Alpine) | 3000 | `npm run dev` (nodemon) |
| `db` | postgres:16-alpine | 5432 | — |

Volumes: `pgdata`, `node_modules` (bind `.:/app` + volume node_modules)

### Makefile (atual)

| Comando | Ação |
|---------|------|
| `make up` | `docker compose up --build` |
| `make up-d` | detached |
| `make down` | para containers |
| `make restart` | reinicia `app` |
| `make logs` | logs do `app` |
| `make logs-all` | todos os serviços |
| `make shell` | shell no container `app` |
| `make db` | psql no postgres |
| `make install` | `npm install` no `app` |
| `make test` | testes no `app` |
| `make reset` | `down -v` (apaga banco) |

### Dockerfile (atual)

- Single-stage, root `/app`, `COPY . .`, `CMD node server.js`
- Build tools para argon2 (python3, make, g++)

### Produção (referência)

- Deploy mencionado em `.env.example`: Render (single-tenant via `TENANT_SLUG`)
- Trust proxy habilitado em `server.js`
- SSL no Postgres em production (`tenantDb.js`)

---

## Evolução por fase

### Fase 0 — Fundação

**Objetivo deploy:** monorepo funcional; legacy idêntico ao hoje.

#### Mudanças docker-compose

```yaml
services:
  legacy:          # renomear app → legacy (ou manter alias app=legacy)
    build:
      context: .
      dockerfile: docker/Dockerfile.legacy
    working_dir: /app/apps/legacy
    ports: ["3000:3000"]
    ...

  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    working_dir: /app/apps/api
    ports: ["3001:3001"]
    environment:
      PORT: 3001
      DATABASE_URL: postgresql://postgres:postgres@db:5432/lojao
      SESSION_SECRET: ${SESSION_SECRET}
    depends_on: [db]

  db: # inalterado
```

Volumes:

- `pnpm-store` ou instalar na imagem
- Montar monorepo root: `.:/app`
- **Evitar** volume único `node_modules` na raiz — usar `pnpm install` no build ou volume por app
- **Entrypoint dev** (`docker/docker-entrypoint-dev.sh`): compara SHA256 do `pnpm-lock.yaml` com marker em `node_modules/.docker-lock-sha256`; roda `pnpm install --filter $PNPM_FILTER` quando lockfile mudou ou volume vazio/sem marker. Evita `Failed to resolve import` após `pnpm add` no host.
- **Makefile:** `make admin-install`, `make api-install`, `make deps-sync` para forçar sync manual.
- **Imagens multi-stage:** `target: dev` no compose; `target: prod` no build de deploy (admin: nginx + `dist/` estático).
- **Cache de build:** Dockerfiles copiam `package.json` + lock antes do código (`deps` stage) — rebuild mais rápido.

#### Makefile — adições Fase 0

```makefile
install:          ## pnpm install na raiz do monorepo
	pnpm install

up:               ## sobe legacy + api + db
	docker compose up --build

logs-api:         ## logs do Fastify
	docker compose logs -f api

logs-legacy:      ## logs do Express
	docker compose logs -f legacy

shell-api:        ## shell no container api
	docker compose exec api sh

test-api:         ## testes do app api
	docker compose exec api pnpm test

typecheck:        ## turbo typecheck em todos os apps
	pnpm turbo typecheck
```

**Compatibilidade:** manter alias `make restart` → `legacy`; `make test` roda testes legacy até Fase 8.

#### Dockerfile.legacy

- `WORKDIR /app`
- Copiar monorepo; `pnpm install --filter legacy...`
- `CMD ["pnpm", "--filter", "legacy", "dev"]`

#### Dockerfile.api

- Mesma base Node 24 Alpine + build tools (argon2 futuro)
- `EXPOSE 3001`
- `CMD ["pnpm", "--filter", "api", "dev"]`

#### Variáveis .env.example — adicionar

```env
# Monorepo
API_PORT=3001
ADMIN_PORT=5173
STOREFRONT_PORT=3002

# URLs internas (Docker)
API_URL=http://api:3001
LEGACY_URL=http://legacy:3000

# URLs públicas (browser dev)
VITE_API_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

### Fase 1 — API + auth

**Mudanças:** nenhuma nova service Docker. Legacy pode proxy `/api/v1` → api (opcional).

#### Legacy proxy (opcional em `apps/legacy/server.js`)

```javascript
// http-proxy-middleware ou fastify proxy
// app.use('/api/v1', createProxyMiddleware({ target: process.env.API_URL }))
```

Se implementado, browser usa só `:3000` para API via proxy. Senão, front chama `:3001` direto com CORS + credentials.

#### Makefile

```makefile
test-all:         ## legacy + api tests
	pnpm turbo test
```

#### CORS (api)

- `credentials: true`
- `origin`: `http://localhost:3000`, `http://localhost:5173`, `http://localhost:3002`

---

### Fase 2 — Admin React

**Nova service:** `admin` (Vite dev server)

```yaml
  admin:
    build:
      dockerfile: docker/Dockerfile.admin
    ports: ["5173:5173"]
    environment:
      VITE_API_URL: http://localhost:3001  # browser acessa host, não docker network
    volumes: [.:/app]
    command: pnpm --filter admin dev --host
```

**Nota Docker + Vite:** o browser roda fora do container; `VITE_API_URL` deve ser `http://localhost:3001`, não `http://api:3001`.

#### Proxy unificado (recomendado Fase 2+)

Adicionar **Caddy** ou **nginx** na porta **8080** (ou manter 3000 como entrada):

| Path | Destino |
|------|---------|
| `/api/*` | api:3001 |
| `/admin/*` | admin:5173 (dev) ou arquivos estáticos (prod) |
| `/*` | legacy:3000 (até Fase 5) |

Arquivo: `docker/Caddyfile`

#### Makefile

```makefile
up-full:          ## legacy + api + admin + db + proxy
	docker compose --profile full up --build

logs-admin:
	docker compose logs -f admin

test-e2e-smoke:   ## Playwright smoke admin (Fase 2+, requer stack up)
	pnpm exec playwright test --grep @smoke
```

Usar `profiles:` no compose para admin/proxy serem opcionais no início.

**Testes (Fase 2+):** QA pode rodar Playwright local contra `:5173` + `:3001`. Ver [TESTING-STRATEGY.md](./TESTING-STRATEGY.md).

---

### Fase 3 — Admin completo

- Admin passa a ser app principal para `/admin/*`
- Legacy redireciona rotas admin migradas (301 ou link)
- **Produção admin:** build estático `pnpm --filter admin build` → servir via Caddy/nginx ou Fastify `@fastify/static`

#### Dockerfile.admin (produção)

Multi-stage: `deps` → `builder` (`pnpm build`) → `prod` (nginx alpine servindo `dist/`). Build:

```bash
docker build --target prod -f docker/Dockerfile.admin \
  --build-arg VITE_API_URL=https://api.seudominio.com \
  -t lojao-admin:prod .
```

Dev usa `target: dev` + entrypoint de sync de deps (ver seção Fase 0 volumes).

---

### Fase 4 — API crítica

**Mudanças deploy críticas:**

| Item | Ação |
|------|------|
| Webhooks Stripe/SumUp | Apontar para **api:3001** `/webhook/*` |
| Socket.io | Migrar para api; legacy desliga socket |
| Feature flag | `USE_NEW_CHECKOUT=true` no compose |
| CSRF | Webhooks **excluídos** de CSRF (como hoje) |

#### docker-compose — api precisa de mesmas envs de pagamento

Copiar do legacy para `api.environment`:

- `STRIPE_*`, `MP_*`, `SUMUP_*`, `EMAIL_*`, etc.

#### Makefile

```makefile
test-integration-api:
	docker compose exec api pnpm test:integration
```

---

### Fase 5 — Storefront Next

**Nova service:** `storefront`

```yaml
  storefront:
    build:
      dockerfile: docker/Dockerfile.storefront
    ports: ["3002:3002"]
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
      TENANT_SLUG: loja
    command: pnpm --filter storefront dev
```

#### Caddyfile atualizado

| Path | Destino |
|------|---------|
| `/` | storefront:3002 |
| `/produto/*` | storefront:3002 |
| `/api/*` | api:3001 |
| `/admin/*` | admin |
| rotas não migradas | legacy:3000 (fallback) |

#### Porta pública única (meta dev)

Usuário acessa **`http://localhost:8080`** — Caddy roteia tudo.

Atualizar `LEIA-ME.md` com nova URL.

---

### Fase 6 — Comprador Next

- Legacy perde vitrine + checkout UI
- Checkout 100% via api + Next
- Playwright e2e no CI (opcional)

#### Makefile

```makefile
test-e2e:         ## Playwright — suite E2E (QA)
	pnpm exec playwright test

test-e2e-ui:      ## Playwright com interface
	pnpm exec playwright test --ui

test-all:         ## unit + integration + e2e smoke
	pnpm turbo test && pnpm exec playwright test --grep @smoke
```

---

### Fase 7 — Drizzle

```makefile
db-migrate:       ## roda migrations drizzle
	pnpm --filter @lojao/db db:migrate

db-generate:      ## gera migration após schema change
	pnpm --filter @lojao/db db:generate

db-studio:        ## drizzle studio
	pnpm --filter @lojao/db db:studio
```

Job de migrate no boot do `api` **somente dev**; produção: migrate como step de deploy.

---

### Fase 8 — Descomissionar legacy

#### docker-compose final

```yaml
services:
  api:
    ports: ["3001:3001"]
  admin:
    # static ou container nginx
  storefront:
    ports: ["3000:3000"]   # Next vira porta principal
  proxy:
    ports: ["80:80", "443:443"]
  db:
    # inalterado
```

**Remover:** serviço `legacy`, `Dockerfile.legacy`, volume legacy-specific.

#### Makefile final (referência)

| Comando | Ação |
|---------|------|
| `make up` | api + admin + storefront + db + proxy |
| `make test` | `pnpm turbo test` |
| `make build` | `pnpm turbo build` |
| `make deploy-check` | test + typecheck + build |
| `make db-migrate` | migrations |
| `make logs` | todos ou por serviço (`logs-api`, etc.) |

#### Produção (Render / VPS)

| Serviço | Sugestão |
|---------|----------|
| api | Web service Node (Fastify) |
| storefront | Web service Next ou static + SSR |
| admin | Static site (CDN) ou mesmo domínio `/admin` |
| db | Postgres gerenciado |
| proxy | Cloudflare / nginx na VPS |

Variáveis produção:

- `DATABASE_URL` (SSL)
- `SESSION_SECRET`, `CSRF_SECRET`
- Domínio wildcard `*.seudominio.com.br` para multi-tenant por subdomínio
- Webhooks URLs apontando para `https://api.seudominio.com.br/webhook/*`

---

## Checklist de deploy por release

Antes de marcar fase como `done`:

- [ ] `docker compose up --build` sobe sem erro
- [ ] `make test` (escopo da fase) passa
- [ ] `LEIA-ME.md` atualizado se URLs/comandos mudaram
- [ ] `.env.example` atualizado
- [ ] Health checks: api `/health`, legacy `:3000` (até Fase 8)
- [ ] Credenciais dev documentadas (admin@loja.com / admin123)

---

## Diagrama deploy final (Fase 8)

```
                    ┌─────────────┐
   Internet ───────►│ Caddy/nginx │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │ storefront │  │   admin    │  │    api     │
    │  (Next.js) │  │  (static)  │  │ (Fastify)  │
    └──────┬─────┘  └────────────┘  └──────┬─────┘
           │                                │
           └────────────────┬───────────────┘
                            ▼
                    ┌──────────────┐
                    │ PostgreSQL 16│
                    └──────────────┘
```

---

## Migração do Makefile — diff resumido

| Comando | Pré-migração | Pós Fase 0 | Pós Fase 8 |
|---------|--------------|------------|------------|
| `make up` | app + db | legacy + api + db | all apps + db |
| `make restart` | app | legacy | api ou all |
| `make install` | npm in app | pnpm root | pnpm root |
| `make test` | legacy jest | legacy jest | turbo test all |
| `make shell` | app | legacy | api (default) |
| `make logs` | app | legacy | configurável |

O agente **deve** atualizar `LEIA-ME.md` e `Makefile` em cada fase que alterar compose.
