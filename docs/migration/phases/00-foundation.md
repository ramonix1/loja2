# Fase 0 — Fundação do monorepo

| Campo | Valor |
|-------|-------|
| **ID** | `phase-0` |
| **Depende de** | — |
| **Duração estimada** | 1–2 semanas (2 devs) |
| **Deploy** | [DEPLOY.md § Fase 0](../DEPLOY.md#fase-0--fundação) |

---

## Objetivo

Criar a estrutura monorepo TypeScript **sem alterar comportamento do produto**. Express continua em `:3000` idêntico ao hoje. Fastify sobe em `:3001` apenas com health check.

---

## Escopo

### IN (implementar)

- [ ] pnpm workspaces + Turborepo na raiz
- [ ] Mover código Express atual para `apps/legacy/` (preservar paths relativos ou ajustar imports)
- [ ] Criar `apps/api/` — Fastify + TypeScript + `/health`
- [ ] Criar `packages/types/` — tipos base vazios ou mínimos
- [ ] Criar `packages/eslint-config/` — tsconfig base compartilhado
- [ ] Criar `packages/test-utils/` — placeholder (`test-ids.ts` vazio, README) para QA/dev
- [ ] `docker/Dockerfile.legacy`, `docker/Dockerfile.api`
- [ ] Atualizar `docker-compose.yml` (serviços `legacy` + `api` + `db`)
- [ ] Atualizar `Makefile` conforme DEPLOY.md
- [ ] Root `package.json` scripts: `dev`, `build`, `test`, `typecheck` via turbo
- [ ] Atualizar `.env.example` com portas monorepo
- [ ] Legacy tests (`jest`) continuam passando

### OUT (não implementar nesta fase)

- Auth, tenant, Drizzle, admin React, Next.js
- Proxy Caddy, mudanças em rotas legacy
- Remover arquivos da raiz sem mover para legacy (pode manter re-exports temporários se necessário)
- **`data-testid` em EJS legacy**
- Specs Playwright contra páginas legacy

---

## Testes automatizados — como implementar

> Guia geral: [TESTING-IMPLEMENTATION.md](../TESTING-IMPLEMENTATION.md) · Estratégia: [TESTING-STRATEGY.md](../TESTING-STRATEGY.md)

### Escopo desta fase

| Tipo | Ação |
|------|------|
| Legacy Jest | **Manter** — apenas garantir que `pnpm --filter legacy test` passa após mover arquivos |
| E2E Playwright | **Scaffold apenas** — app vazio executável, sem specs de UI legacy |
| data-testid | **Não aplicar** — nenhuma tela nova ainda |

### Entregáveis obrigatórios

1. **`apps/e2e/`**
   - `package.json` com `@playwright/test`
   - `playwright.config.ts` conforme [TESTING-IMPLEMENTATION.md](../TESTING-IMPLEMENTATION.md)
   - `tests/.gitkeep` ou `tests/example.skip.spec.ts` comentado
   - Script `"test": "playwright test"`

2. **`packages/test-utils/`**
   ```
   src/
     test-ids/
       index.ts          # re-export
       auth.ts           # constantes (valores usados na Fase 2)
     fixtures/
       README.md         # credenciais dev documentadas
   ```

3. **Root `package.json`**
   - `"test:e2e": "pnpm --filter e2e test"`
   - `"test:legacy": "pnpm --filter legacy test"`

4. **`.gitignore`**
   - `apps/e2e/.auth/`, `apps/e2e/test-results/`, `playwright-report/`

### Comandos de verificação (testes)

```bash
pnpm --filter legacy test          # Jest — deve passar
pnpm --filter e2e exec playwright install chromium
pnpm test:e2e                      # 0 tests ou example skip — sem falha
```

### Pronto para o testador (após Fase 0)

- Playwright instalado e configurado
- Pode criar branch e preparar pasta `tests/admin/` (specs vazios) **sem** apontar para EJS legacy
- Credenciais dev documentadas em `packages/test-utils/src/fixtures/README.md`


## Estrutura de arquivos a criar

```
pnpm-workspace.yaml
turbo.json
package.json                    # root
apps/
  legacy/
    package.json
    server.js                   # movido da raiz
    controllers/ routes/ ...    # movidos
  api/
    package.json
    tsconfig.json
    src/
      index.ts
      app.ts
      routes/health.ts
packages/
  types/
    package.json
    src/index.ts
  eslint-config/
    package.json
    base.json
docker/
  Dockerfile.legacy
  Dockerfile.api
```

---

## Tarefas detalhadas

### 1. Monorepo root

**pnpm-workspace.yaml:**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**turbo.json** — pipelines: `build`, `dev`, `test`, `typecheck`, `lint`

**Root package.json:**
- `"packageManager": "pnpm@9.x"`
- `"engines": { "node": ">=24" }`
- scripts delegando ao turbo

### 2. apps/legacy

- Mover: `server.js`, `controllers/`, `routes/`, `services/`, `middlewares/`, `config/`, `views/`, `public/`, `tests/`, `scripts/`, `utils/`, `data/`
- `package.json` com dependências atuais do root
- Manter `"dev": "nodemon server.js"`, `"test": "jest --coverage"`
- Ajustar paths se necessário (uploads, static `public/`)

**Compatibilidade raiz (opcional):**
- Manter `server.js` na raiz como one-liner: `require('./apps/legacy/server.js')` OU documentar que entry é `apps/legacy`

### 3. apps/api

```typescript
// src/app.ts — Fastify instance
// src/routes/health.ts — GET /health → { status: 'ok', service: 'lojao-api' }
// src/index.ts — listen PORT default 3001
```

Dependências: `fastify`, `@fastify/cors`, `typescript`, `tsx` (dev)

### 4. packages/types

Exportar interfaces stub:
- `Tenant`, `Usuario`, `ApiResponse<T>`, `ApiError`

### 5. Docker

Seguir DEPLOY.md. Legacy deve subir e responder igual ao compose anterior.

---

## Critérios de aceite (DoD)

- [ ] `pnpm install` na raiz completa sem erro
- [ ] `make up` sobe `legacy`, `api`, `db`
- [ ] `http://localhost:3000` — vitrine legacy funciona (login admin@loja.com)
- [ ] `http://localhost:3001/health` → 200 JSON
- [ ] `make test` — testes legacy passam (mesmo coverage anterior ou superior)
- [ ] `pnpm turbo typecheck` — api e packages passam
- [ ] `packages/test-utils` criado (estrutura para testids/E2E futuro)
- [ ] `LEIA-ME.md` menciona monorepo e portas 3000 + 3001
- [ ] `STATUS.md` atualizado: Fase 0 → `done`

---

## Verificação (comandos)

```bash
pnpm install
make up-d
curl -sf http://localhost:3001/health | jq .
curl -sf -o /dev/null -w "%{http_code}" http://localhost:3000/   # esperado 200 ou 302
make test
pnpm turbo typecheck
```

---

## Handoff para Fase 1

Entregar:
- Monorepo funcional documentado
- Lista de paths movidos vs raiz
- Notas sobre imports quebrados e como foram resolvidos
- `apps/api` pronto para plugins de sessão e tenant

---

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Paths quebrados após mover legacy | Testar boot + 3 rotas manualmente |
| node_modules nativos (argon2) | Build tools no Dockerfile; pnpm filter |
| Duplicar dependências | legacy mantém package.json próprio na Fase 0 |
