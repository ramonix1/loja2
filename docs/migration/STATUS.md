# Status da migração

> **Agente implementador:** atualize este arquivo ao concluir cada fase.

## Fase atual

| Campo | Valor |
|-------|-------|
| **Fase ativa** | 3 — Admin completo (próxima) |
| **Iniciada em** | 2026-06-11 |
| **Concluída em** | 2026-06-11 (Fase 2) |
| **Responsável** | Agente implementador |

## Progresso por fase

| Fase | Nome | Status | Data conclusão | Notas |
|------|------|--------|----------------|-------|
| 0 | Fundação | `done` | 2026-06-11 | Monorepo pnpm+turbo, legacy movido, api `/health`, e2e+test-utils scaffold, Docker/Makefile |
| 1 | API + auth + tenant | `done` | 2026-06-11 | Auth/tenant Fastify + sessão compartilhada (cross-check API↔legacy ok) |
| 2 | Primeiro admin React | `done` | 2026-06-11 | apps/admin (login/dashboard/pedidos) + API admin + packages/ui + e2e smoke 5/5 |
| 3 | Admin completo | `pending` | — | — |
| 4 | API crítica (checkout) | `pending` | — | — |
| 5 | Vitrine Next (público) | `pending` | — | — |
| 6 | Comprador Next | `pending` | — | — |
| 7 | Drizzle + migrations | `pending` | — | — |
| 8 | Descomissionar legacy | `pending` | — | — |

Status permitidos: `pending` | `in_progress` | `blocked` | `done`

## Métricas

| Métrica | Valor | Meta final |
|---------|-------|------------|
| Rotas Express ativas | 100% | 0% |
| Páginas EJS restantes | 34 | 0 |
| Apps no monorepo | 2 (api, admin) | 3 (api, admin, storefront) |
| Rotas API `/api/v1` | 6 (login, logout, me, tenant/config, admin/dashboard/stats, admin/pedidos) | — |
| Legacy removido | não | sim |
| Telas com data-testid (admin+store) | 3 (login, dashboard, pedidos) | 100% das telas React/Next |
| Specs Playwright | 4 (login smoke+erro, pedidos smoke, sidebar) + setup | smoke críticos (login, pedidos, checkout) |

## Equipe

| Papel | Envolvimento na migração |
|-------|--------------------------|
| Dev front | UI + testids |
| Dev back | API + testes integração |
| Testador QA | Playwright + catálogo — ver [TESTING-STRATEGY.md](./TESTING-STRATEGY.md) |

## Bloqueios / decisões pendentes

_Nenhum._

### Notas / desvios da Fase 0

- **Não existiam `docker-compose.yml`, `Makefile` nem `Dockerfile` na raiz** (apesar de citados em CONTEXT/DEPLOY). Foram criados do zero conforme DEPLOY.md § Fase 0.
- **`apps/legacy/config/masterDb.js`**: ajuste mínimo e seguro — SSL continua ligado em produção/quando há `DATABASE_URL`, mas pode ser desligado via `PGSSL=disable` (usado no `docker-compose.yml`, pois o Postgres dev não tem SSL). Comportamento de produção inalterado.
- **`apps/legacy/package.json`**: adicionado `nodemon` em devDeps (script `dev` usa `nodemon server.js`, conforme spec).
- **Docker dev**: cada serviço (`legacy`, `api`) usa volumes de `node_modules` **separados** (`*_root_node_modules` + `*_app_node_modules`). Compartilhar `/app/node_modules` entre imagens com `pnpm install --filter` diferente causava deps faltando (quem populava o volume primeiro vencia).
- **Engine**: ambiente dev local é Node 20; imagens Docker usam Node 24. `.npmrc` com `engine-strict=false` para o `pnpm install` local não falhar (root declara `engines.node >=24`).
- Removido `package-lock.json` (npm) da raiz — monorepo usa `pnpm-lock.yaml`.

### Notas / desvios da Fase 1

- **Sessão sem `@fastify/session`**: a spec sugeria `@fastify/session` + `@fastify/cookie`, mas `@fastify/session` **não é wire-compatible** com `express-session`/`connect-pg-simple` (prefixo `s:`, serialização do `sess`, store). Como o DoD exige **compartilhamento real de sessão** com o legacy, optou-se (opção conservadora, menor risco) por um **plugin de sessão próprio** que reproduz exatamente o formato do Express: cookie `lojao.sid` assinado com `s:`+HMAC-SHA256(base64, sem padding) e store na tabela `sessao`. `@fastify/cookie` é usado para parse/serialização do cookie. **Verificação cruzada validada nos dois sentidos** (API→legacy `/admin` 200; legacy→API `/me` 200).
- **Pool do tenant em testes**: em dev, master e tenant são o mesmo Postgres, mas o `db_host` da linha `tenants` difere entre Docker (`db`) e host (`localhost`). Para os testes vitest (host) não dependerem disso, `tenant-db.ts` usa `DATABASE_URL` para o pool do tenant **quando `NODE_ENV=test`** (a busca/validação do tenant na tabela continua igual). Fora de teste, comportamento idêntico ao legacy (`getPool` por `db_*`).
- **Seed de teste idempotente**: cria tabelas mínimas (master + tenant) se faltarem, registra o tenant `loja` com `ON CONFLICT DO NOTHING` (**não** sobrescreve `db_*` de tenant já provisionado), garante o admin `admin@loja.com` e faz `TRUNCATE tentativas_login` (limpa rate-limit). Único efeito destrutivo: reset de `tentativas_login` e do hash de senha do admin de teste (para `admin123`).
- **Docker `node_modules`**: novas deps (`@fastify/cookie`, `pg`, `argon2`, `zod`, `fastify-plugin`, `vitest`) exigiram **recriar os volumes** `loja2_api_*_node_modules` (volume nomeado mascara o `node_modules` da imagem). Documentado para futuros rebuilds com deps novas.
- **`@fastify/session` não instalado**: decisão acima; se uma spec futura exigir, reavaliar.

### Handoff para Fase 1

- Monorepo funcional: `pnpm install`, `pnpm turbo typecheck`, `make test`, `make up` validados.
- Paths movidos para `apps/legacy/`: `server.js`, `config/`, `controllers/`, `routes/`, `services/`, `middlewares/`, `utils/`, `data/`, `scripts/`, `tests/`, `views/`, `public/`, `jest.config.js`, `setup.sql`, `banco.sql`. Sem imports quebrados (relativos preservados; `__dirname`/cwd intactos).
- `apps/api` pronto para receber plugins de sessão/tenant e rotas `/api/v1`.
- `packages/test-utils` e `apps/e2e` prontos para o QA (Playwright instalado; falta `playwright install chromium`, sem specs ainda).

### Handoff para Fase 2

- **Auth API estável** sob `/api/v1` (login/logout/me) + `GET /api/v1/tenant/config`. Sessão compartilhada com legacy (cookie `lojao.sid`).
- **Client fetch:** usar `credentials: 'include'` e header `X-Tenant-Slug: loja` (dev). CORS já libera `:3000`, `:5173`, `:3002` com `credentials`.
- **Fixture login programático:** `loginAdmin(apiUrl)` em `@lojao/test-utils` (`packages/test-utils/src/fixtures/auth.ts`) retorna o cookie `lojao.sid=...`. Pronto para `apps/e2e/fixtures/auth.setup.ts`.
- **OpenAPI parcial:** `apps/api/openapi.yaml` (auth + tenant).
- **Testes:** `pnpm --filter api test` (7 casos vitest+inject); requer Postgres em `DATABASE_URL`.

### Notas / desvios da Fase 2

- **`packages/ui` criado** (Button, Card, Table, Sidebar, LayoutAdmin) sem acoplamento ao roteador: `Sidebar` recebe os links via `children` e o admin passa `NavLink`. Consumido como **source TS** pelo Vite (`exports` → `src/index.ts`, imports sem extensão, `moduleResolution: Bundler`). Tailwind 4 via `@tailwindcss/vite` + `@source` no CSS para escanear `packages/ui/src`.
- **`produtos_ativos`**: a tabela `produtos` não tem flag `ativo` (igual ao legacy, cujo card usa `COUNT(*)`), então `produtos_ativos = COUNT(*) FROM produtos`. `pedidos_pendentes = status 'aguardando_pagamento'`; `receita_mes = SUM(total) pago no mês corrente`; `pedidos_hoje = created_at::date = hoje`.
- **Tabela de pedidos sempre renderizada**: `admin-pedidos-table` fica no DOM mesmo vazia (empty-state é uma linha interna com `admin-pedidos-empty-state`), para o smoke `getByTestId('admin-pedidos-table')` passar independente de haver dados.
- **Guard admin** (`requireAdmin`): 401 sem sessão, 403 se `role != 'admin'`. Seed de teste agora cria também um usuário comum (`comprador-test@loja.com`) para validar o 403.
- **Seed de teste**: adiciona tabelas mínimas `produtos`/`pedidos` (CREATE IF NOT EXISTS, não-destrutivo) para as queries admin rodarem na CI/host onde o legacy pode não ter inicializado o tenant.
- **E2E `setup` marcado `@smoke`**: como `--grep @smoke` filtra todos os projetos, o teste do projeto `setup` (login → storageState) recebe `@smoke` para não ser pulado e quebrar a dependência das specs admin.
- **Link "Novo painel (beta)"** adicionado no `admin-sidebar.ejs` do legacy (apenas um link para `http://localhost:5173/admin/dashboard`; **sem** `data-testid` no EJS). Legacy `/admin/pedidos` segue funcionando em paralelo.
- **Docker admin**: serviço `admin` sob profile `full` (`make up-full`). No browser, `VITE_API_URL=http://localhost:3001` (não hostname Docker).

### Handoff para Fase 3

- **`packages/ui`** com Button/Card/Table/Sidebar/LayoutAdmin reutilizáveis; padrão de página admin estabelecido (route + TanStack Query + testids).
- **Auth no front:** `AuthProvider`/`useAuth` (`apps/admin/src/lib/auth-context.tsx`) + `ProtectedRoute`. `api-client.ts` com `credentials` + `X-Tenant-Slug` e `ApiError` (preserva `code`).
- **Guard admin reutilizável:** `requireAdmin` (`apps/api/src/plugins/auth-guard.ts`) para novas rotas `/api/v1/admin/*`.
- **Testids:** constantes em `@lojao/test-utils/test-ids` (`testIds.admin.*`, `testIds.auth.*`); catálogo atualizado. Para novos módulos (produtos, categorias...), seguir a convenção `{app}-{pagina}-{elemento}`.
- **Falta na Fase 3:** CRUD (forms), demais módulos admin, edição de status de pedido, detalhe de pedido.

## Log de entregas

<!-- Formato: YYYY-MM-DD — Fase N — resumo -->
- 2026-06-11 — Fase 2 — Primeiro admin React. `apps/admin` (Vite + React 19 + React Router 7 + Tailwind 4 + TanStack Query): login, dashboard (4 cards) e pedidos (tabela read-only paginada). `packages/ui` (Button, Card, Table, Sidebar, LayoutAdmin). API: `GET /api/v1/admin/dashboard/stats` e `GET /api/v1/admin/pedidos` com guard `requireAdmin` (401/403). `data-testid` em login/dashboard/pedidos via `@lojao/test-utils` (`testIds.auth.*`/`testIds.admin.*`), catálogo atualizado. Playwright: `fixtures/auth.setup.ts` + `tests/admin/login.spec.ts` + `pedidos.spec.ts` (`@smoke`) — 5/5 ✓. Docker: serviço `admin` (profile `full`), `Dockerfile.admin`, `make up-full`/`logs-admin`/`test-e2e[-smoke]`. Link "Novo painel" no sidebar EJS legacy (sem testid). Verificações: typecheck ✓, api vitest 13/13 ✓, legacy Jest 56/56 ✓, admin `vite build` ✓, e2e 5/5 ✓.
- 2026-06-11 — Fase 1 — Auth + tenant no Fastify (`/api/v1`). Plugin de sessão próprio compatível com `express-session`/`connect-pg-simple` (cookie `lojao.sid`, tabela `sessao`, assinatura `s:`/HMAC). Rotas `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `GET /tenant/config`. Plugin de tenant (`resolveSlug` + `request.db`/`tenantId`, 404 `TENANT_NOT_FOUND`). Libs `master-db`, `tenant-db` (`getPool`), `session-signature`. CORS credentials. 7 testes vitest+inject (login ok/erro, me anon/auth, logout, tenant config, tenant not-found) — 7/7 ✓. Helper `loginAdmin` em `@lojao/test-utils`. `openapi.yaml` parcial. **Verificação cruzada validada**: API login → legacy `/admin` (200) e legacy login → API `/me` (200). Legacy Jest 56/56 ✓. Typecheck ✓.
- 2026-06-11 — Fase 0 — Monorepo pnpm+Turborepo. Legacy movido para `apps/legacy` (comportamento idêntico, 56 testes Jest passando). `apps/api` Fastify+TS com `GET /health`. Packages `types`, `eslint-config`, `test-utils`. Scaffold `apps/e2e` (Playwright). Docker (`Dockerfile.legacy`, `Dockerfile.api`, `docker-compose.yml`), `Makefile`, `.env.example`, `.gitignore`, `LEIA-ME.md` atualizados. Verificado: `make up` (legacy :3000 + api :3001/health + db), `make test`, `pnpm turbo typecheck`.
