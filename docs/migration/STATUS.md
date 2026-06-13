# Status da migração

> **Agente implementador:** atualize este arquivo ao concluir cada fase.

## Fase atual

| Campo | Valor |
|-------|-------|
| **Fase ativa** | — (migração concluída) |
| **Iniciada em** | 2026-06-12 |
| **Concluída em** | 2026-06-12 |
| **Responsável** | Agente implementador |

## Progresso por fase

| Fase | Nome | Status | Data conclusão | Notas |
|------|------|--------|----------------|-------|
| 0 | Fundação | `done` | 2026-06-11 | Monorepo pnpm+turbo, legacy movido, api `/health`, e2e+test-utils scaffold, Docker/Makefile |
| 1 | API + auth + tenant | `done` | 2026-06-11 | Auth/tenant Fastify + sessão compartilhada (cross-check API↔legacy ok) |
| 2 | Primeiro admin React | `done` | 2026-06-11 | apps/admin (login/dashboard/pedidos) + API admin + packages/ui + e2e smoke 5/5 |
| 3 | Admin completo | `done` | 2026-06-12 | 12 módulos + dashboard/pedidos expand; `admin-clientes.ejs` permanece |
| 4 | API crítica (checkout) | `done` | 2026-06-12 | cart, frete, checkout, webhooks, billing, socket chat, flags USE_NEW_* |
| 5 | Vitrine Next (público) | `done` | 2026-06-12 | storefront :3002, API public, redirect legacy, e2e vitrine |
| 6 | Comprador Next | `done` | 2026-06-12 | auth, carrinho, checkout, pedidos, banner; e2e store 6 specs @smoke |
| 7 | Drizzle + migrations | `done` | 2026-06-12 | `@lojao/db` baseline + migrate; API auth/public/listPedidos Drizzle |
| 8 | Descomissionar legacy | `done` | 2026-06-12 | legacy removido; stack api+admin+storefront+db; CI test:all |

Status permitidos: `pending` | `in_progress` | `blocked` | `done`

## Métricas

| Métrica | Valor | Meta final |
|---------|-------|------------|
| Rotas Express ativas | 0% | 0% |
| Páginas EJS restantes | 0 | 0 |
| Apps no monorepo | 3 (api, admin, storefront) | 3 (api, admin, storefront) |
| Rotas API `/api/v1` | 59+ | — |
| Páginas admin EJS restantes | 0 | 0 |
| Legacy removido | sim | sim |
| Telas com data-testid (admin+store) | 100% admin + vitrine Next | 100% das telas React/Next |
| Specs Playwright | 38 (admin + store @smoke) + setup | smoke críticos admin + vitrine + comprador |

## Equipe

| Papel | Envolvimento na migração |
|-------|--------------------------|
| Dev front | UI + testids |
| Dev back | API + testes integração |
| Testador QA | Playwright + catálogo — ver [TESTING-STRATEGY.md](./TESTING-STRATEGY.md) |

## Fase 3 — progresso por módulo

| # | Módulo | API | UI | testids | vitest | e2e | redirect | EJS removido | Status |
|---|--------|-----|----|---------|--------|-----|----------|--------------|--------|
| 1 | Categorias | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `done` |
| 2 | Banners | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `done` |
| 3 | Aparência | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `done` |
| 4 | Produtos | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `done` |
| 5 | Compradores | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓* | `done` |
| 6 | Configurações | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `done` |
| 7 | Relatórios | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `done` |
| 8 | Agenda | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `done` |
| 9 | Permissões | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `done` |
| 10 | Chat | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `done` |
| 11 | Diagnóstico | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `done` |
| 12 | Pedidos detalhe | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `done` |
| — | Dashboard expand | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `done` |
| — | Pedidos expand | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `done` |
| 13 | Dashboard gráficos (Recharts) | ✓ | ✓ | ✓ | ✓ | ✓ | n/a | n/a | `done` |

> **Melhoria opcional (mód. 13):** pode ser executada **antes da Fase 5** como sessão focada de UX admin. Não bloqueia vitrine Next. Ver [phases/03-admin-modules.md § Dashboard — gráficos Recharts](./phases/03-admin-modules.md#melhoria--dashboard--gráficos-recharts).

## Bloqueios / decisões pendentes

- **E-mail de rastreio no PATCH status:** legacy envia e-mail via `enviarEmailRastreio` quando status=`enviado` + código; API ainda **não** replica (desvio documentado; UI avisa). Migrar com serviço de e-mail na Fase 4+.
- **`admin-clientes.ejs`** (showcase logos) permanece no legacy — feature distinta de compradores.

### Notas / desvios da Fase 0

- **Não existiam `docker-compose.yml`, `Makefile` nem `Dockerfile` na raiz** (apesar de citados em CONTEXT/DEPLOY). Foram criados do zero conforme DEPLOY.md § Fase 0.
- **`apps/legacy/config/masterDb.js`**: ajuste mínimo e seguro — SSL continua ligado em produção/quando há `DATABASE_URL`, mas pode ser desligado via `PGSSL=disable` (usado no `docker-compose.yml`, pois o Postgres dev não tem SSL). Comportamento de produção inalterado.
- **`apps/legacy/package.json`**: adicionado `nodemon` em devDeps (script `dev` usa `nodemon server.js`, conforme spec).
- **Docker dev**: cada serviço (`legacy`, `api`, `admin`) usa volumes de `node_modules` **separados** (`*_root_node_modules` + `*_app_node_modules`). Compartilhar `/app/node_modules` entre imagens com `pnpm install --filter` diferente causava deps faltando (quem populava o volume primeiro vencia). **Entrypoint** `docker/docker-entrypoint-dev.sh` sincroniza deps quando `pnpm-lock.yaml` muda ou volume sem marker.
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

### Notas / desvios da Fase 3 (sessão 1 — módulo Categorias)

- **Escopo parcial**: Fase 3 permanece `in_progress`. Nesta sessão concluído **módulo 1 (Categorias)**; módulos 2–12 + expansões dashboard/pedidos ficam para próximas sessões (ainda Fase 3).
- **Redirect legacy**: helper `apps/legacy/utils/adminRedirect.js` + `ADMIN_URL` (default `http://localhost:5173`). Rotas POST do legacy também redirecionam (não processam mais CRUD).
- **EJS removidos**: `admin-categorias.ejs`, `admin-categoria-editar.ejs`.
- **Zod em `@lojao/types`**: schemas `createCategoriaSchema`/`updateCategoriaSchema` exportados em `@lojao/types/categorias`.
- **Rota React edição**: `/admin/categorias/:id` (sem `/editar` no path; redirect legacy `/editar` → React).

### Notas / desvios da Fase 3 (sessão 2 — módulo Banners)

- **Upload `@fastify/multipart`**: imagens salvas em `apps/legacy/public/images` (mesmo path do multer legacy); URL retornada `/images/{timestamp}{ext}`. Env opcional `UPLOAD_DIR` na API.
- **Admin exibe imagens** via `VITE_LEGACY_URL` (default `http://localhost:3000`) + helper `legacyImageUrl()`.
- **Rotas React**: `/admin/banners`, `/admin/banners/novo`, `/admin/banners/:id` (edição).
- **EJS removidos**: `admin-banners.ejs`, `admin-banner-form.ejs`.

### Notas / desvios da Fase 3 (sessão 3 — módulo Aparência)

- **API GET/PUT** `/admin/aparencia` — config `loja_*` com upload opcional de `logo` e `favicon` (multipart).
- **Parser multipart múltiplo:** `parseMultipartMulti` em `apps/api/src/lib/multipart.ts`.
- **Rota React:** `/admin/aparencia` (form único com preview ao vivo).
- **EJS removido:** `admin-aparencia.ejs`.

### Notas / desvios da Fase 3 (sessão 4 — módulo Produtos)

- **API CRUD** `/admin/produtos` + upload múltiplo (`imagens[]`), `PATCH .../estoque`, `DELETE .../imagens/:imagemId`.
- **Parser** `parseMultipartAll` para vários arquivos no mesmo campo.
- **Rotas React:** `/admin/produtos` (lista + criar), `/admin/produtos/:id` (editar).
- **EJS removidos:** `admin.ejs`, `editar.ejs` (páginas admin de produtos; `detail.ejs` público permanece no legacy).
- **Compat legacy:** API aceita campo `titulo` como alias de `nome` no multipart.

### Notas / desvios da Fase 3 (sessão 5 — módulo Compradores)

- **Escopo parcial da spec EJS:** removidos `admin-compradores.ejs` e `admin-comprador-detalhe.ejs`. **`admin-clientes.ejs`** (logos showcase, CRUD em `/admin/clientes`) permanece — feature distinta de compradores (usuários `role=usuario`); não consta nas rotas React do módulo 5 (`/admin/compradores`). Migrar em módulo futuro ou extensão documentada.
- **API** `GET /admin/compradores` (lista + busca + totais) e `GET /admin/compradores/:id` (ficha com pedidos/agendamentos/resumo). Queries portadas de `compradorController.js`.
- **Agendamentos:** query de detalhe usa `.catch(() => [])` se tabela `agendamentos` não existir no tenant (dev parcial).
- **Rotas React:** `/admin/compradores`, `/admin/compradores/:id`. Link na sidebar admin React.
- **Redirect legacy:** `compradorRoutes.js` → `ADMIN_URL`.
- **testids:** `testIds.adminCompradores.*`. vitest 6 casos. Playwright `compradores.spec.ts`.

### Notas / desvios da Fase 3 (sessão 6 — módulo Configurações)

- **API** `GET/PUT /admin/configuracoes` — estoque, SumUp, frete (Melhor Envio + dimensões), módulo agenda. JSON body (sem upload). Porta `configController.salvarConfiguracoes`.
- **Diagnóstico de pagamentos** migrado no módulo 11 (`/admin/diagnostico`); link na UI React usa React Router.
- **Rota React:** `/admin/configuracoes`. Link na sidebar admin React.
- **Redirect legacy:** GET/POST `/admin/configuracoes` → `ADMIN_URL`.
- **EJS removido:** `admin-configuracoes.ejs`.
- **testids:** `testIds.adminConfiguracoes.*`. vitest 5 casos. Playwright `configuracoes.spec.ts`.

### Notas / desvios da Fase 3 (sessão 7 — módulo Relatórios)

- **API** `GET /admin/relatorios?aba=&inicio=&fim=&filtro_estoque=` + `GET /admin/relatorios/csv/:tipo`. Lógica portada de `relatorioController.js` (7 abas + export CSV UTF-8 BOM).
- **Agendamentos:** query retorna vazio se tabela `agendamentos` não existir no tenant.
- **Rota React:** `/admin/relatorios` com abas, filtro de datas, filtros estoque, export CSV via API.
- **Redirect legacy:** GET `/admin/relatorios` e `/admin/relatorios/csv/:tipo` → React (CSV baixado pela UI via `/api/v1`).
- **EJS removido:** `admin-relatorios.ejs`.
- **testids:** `testIds.adminRelatorios.*`. vitest 6 casos. Playwright `relatorios.spec.ts`.

### Notas / desvios da Fase 3 (sessão 8 — módulo Agenda)

- **API admin** `GET /admin/agenda?mes=` + `PUT /admin/agenda/config` + `PUT /admin/agenda/dias` + `DELETE /admin/agenda/dias/:data`. Lógica portada de `agendaController.js` (config + dias especiais + mapa agendados).
- **API pública checkout** (`GET /api/agenda/disponibilidade`, `/api/agenda/verificar`) permanece no legacy até Fase 4.
- **Rota React:** `/admin/agenda` com calendário mensal, config geral, painel de dia especial. Link na sidebar admin React.
- **Redirect legacy:** GET/POST admin agenda → `ADMIN_URL`; rotas públicas intactas.
- **EJS removido:** `admin-agenda.ejs`.
- **testids:** `testIds.adminAgenda.*`. vitest 7 casos. Playwright `agenda.spec.ts`.

### Notas / desvios da Fase 3 (sessão 9 — módulo Permissões)

- **API** `GET/POST /admin/permissoes`, `PATCH /admin/permissoes/:id/toggle`, `DELETE /admin/permissoes/:id`. CRUD admins portado de `authController` (criar/toggle/excluir/exibirPermissoes).
- **Proteção:** toggle/delete retorna `403 CANNOT_MODIFY_SELF` ao tentar alterar a própria conta.
- **Senha:** hash argon2id com mesmas opções do legacy.
- **Rota React:** `/admin/permissoes` — form criar + tabela com suspender/remover. Link na sidebar.
- **Redirect legacy:** rotas `/admin/permissoes/*` → React.
- **EJS removido:** `admin-permissoes.ejs`.
- **testids:** `testIds.adminPermissoes.*`. vitest 8 casos. Playwright `permissoes.spec.ts`.

### Notas / desvios da Fase 3 (sessão 10 — módulo Chat)

- **API REST** `GET/POST/PUT/DELETE /admin/chat/*` — conversas, mensagens (marca lidas), CRUD bot_respostas. Portado de `chatController.js`.
- **Socket.IO permanece no legacy** (`apps/legacy/config/socketio.js`): admin React conecta via `socket.io-client` + `VITE_LEGACY_URL` com `withCredentials`. CORS adicionado no legacy para `ADMIN_URL`. Migração do socket para API prevista Fase 4+.
- **Rota React:** `/admin/chat` — lista, chat ativo, assumir/liberar bot, encerrar, modal bot. Link na sidebar.
- **Redirect legacy:** GET `/admin/chat` → React; rotas REST legacy removidas.
- **EJS removido:** `admin-chat.ejs`.
- **testids:** `testIds.adminChat.*`. vitest 7 casos. Playwright `chat.spec.ts`.

### Notas / desvios da Fase 3 (sessão 11 — módulo Diagnóstico)

- **API** `GET /admin/diagnostico` — health check de env (MP, SumUp, APP_URL) + testes de conexão via `fetch` (sem SDK mercadopago na API). Portado de `configController.diagnostico`.
- **Rota React:** `/admin/diagnostico` — cards de status + guia de credenciais + botão atualizar. Acesso via link em Configurações (sem item na sidebar, igual legacy).
- **Redirect legacy:** GET `/admin/diagnostico` → React.
- **EJS removido:** `admin-diagnostico.ejs`.
- **testids:** `testIds.adminDiagnostico.*`. vitest 4 casos. Playwright `diagnostico.spec.ts`.

### Notas / desvios da Fase 3 (sessão 12 — módulo Pedidos detalhe + expansões)

- **API** `GET /admin/pedidos/:id` + `PATCH /admin/pedidos/:id/status`. `listPedidos` expandido (`metodo_pagamento`, `total_itens`). `getDashboardStats` expandido (totais legacy + `pedidos_recentes`).
- **Rotas React:** `/admin/pedidos/:id` (detalhe + form status/rastreio), listagem com filtro status + colunas extras, dashboard com 5 cards legacy + pedidos recentes.
- **Redirect legacy:** `checkoutRoutes.js` pedidos + `produtoRoutes.js` `/admin` → React.
- **EJS removidos:** `admin-pedido-detalhe.ejs`, `admin-pedidos.ejs`, `admin-dashboard.ejs`.
- **E-mail rastreio:** não portado na API (desvio; ver bloqueios).
- **testids:** `testIds.adminPedidoDetail.*`, `admin.pedidosFilterStatus`, `admin.pedidosViewBtn`, `admin.dashboardRecentOrders`. vitest +8 casos pedidos, +4 dashboard. Playwright `pedidos.spec.ts` expand + `dashboard.spec.ts`.

### Handoff para Fase 5

- **Checkout automatizável via API** — método `teste` (dev), fixture `seedPedidoTeste` em `@lojao/test-utils`.
- **Contratos:** `GET/POST /api/v1/checkout`, `POST /api/v1/shipping/calculate`, `GET /api/v1/public/payment-config`.
- **Webhooks:** `POST /webhook/stripe`, `POST /webhook/sumup` na API (sem CSRF, idempotência `webhook_events`).
- **Feature flags** `USE_NEW_*` no legacy — proxy checkout/cart/frete; socket legacy desliga com `USE_NEW_CHAT=true`.
- **Seed dev:** `make seed` popula produtos, compradores e pedidos em vários status — útil para gráficos do dashboard (mód. 13).
- **Opcional antes da vitrine:** módulo 13 — dashboard com gráficos Recharts — **done** (2026-06-12).
- **Próximo:** vitrine Next (Fase 5), checkout UI Next (Fase 6).

### Notas / desvios da Fase 4

- **E-mail transacional na API:** log-only quando SMTP ausente (legacy nodemailer intacto); notificação pedido pago não bloqueia checkout.
- **Socket.io:** anexo ao server HTTP Fastify (`plugins/socketio.ts`); admin React pode migrar de `VITE_LEGACY_URL` para API quando `USE_NEW_CHAT=true`.
- **Billing super-admin:** mesma regra e-mail hardcoded do legacy (`SUPER_ADMIN_EMAIL`, default `ramon.oliveira08@gmail.com`).
- **Commission `pedido_id`:** coluna INTEGER na seed de teste (legacy migration UUID não usado na prática).
- **Testes:** 98 vitest (28 arquivos) incl. 10 novos integração Fase 4 + 3 unit frete; fixture IDs via `.fixture-ids.json` (globalSetup).
- **Frete legacy proxy:** flag `USE_NEW_CHECKOUT` (não `USE_NEW_CART`) — frete é parte do fluxo checkout.

### Notas / desvios — módulo 13 (Dashboard Recharts)

- **API** `GET /api/v1/admin/dashboard/charts?periodo=7d|30d|90d` — agregações em `order-analytics.ts` compartilhadas com `relatorios.service.ts` (financeiro por dia/método).
- **UI** 4 gráficos Recharts + seletor de período; `ChartCard` em `packages/ui`; animação desligada com `prefers-reduced-motion`.
- **testids** `admin-dashboard-chart-*`. vitest 4 casos charts. Playwright dashboard @smoke expand.
- **Seed:** `make seed` popula pedidos `[DEV]` — gráficos exibem dados após seed.

### Handoff para Fase 6

- **Vitrine Next** em `apps/storefront` — home + detalhe SSR, tema tenant, testids + e2e smoke.
- **API pública:** `GET /api/v1/public/store|categories|products|products/:id`.
- **Legacy:** `USE_NEW_STOREFRONT=true` redireciona `/` e `/produto/:id` → `:3002`.
- **Docker:** serviço `storefront` no profile `full`; Caddy opcional (`--profile proxy`) em `:8080`.
- **Próximo:** carrinho, checkout, área comprador (Fase 6).

### Notas / desvios da Fase 5

- **Auth vitrine:** `/login` e `/cadastro` no Next redirecionam para legacy (302).
- **Carrinho:** botão `store-product-add-cart-btn` desabilitado até Fase 6.
- **Imagens:** servidas via `NEXT_PUBLIC_LEGACY_URL` + path `/images/...`.
- **SSR Docker:** `API_URL=http://api:3001` no container; browser usa `NEXT_PUBLIC_API_URL`.
- **Testes:** vitest public.store + public.products; Playwright `store/vitrine.spec.ts` @smoke.
- **testid home:** `store-home-product-grid` no wrapper único da página (evita strict mode Playwright com várias categorias).
- **pnpm-lock.yaml:** atualizado com deps do `apps/storefront` (necessário para `Dockerfile.storefront` frozen-lockfile).
- **Verificação pós-queda WSL (2026-06-12):** typecheck ✓, build prod storefront ✓, e2e store 2/2 ✓, legacy redirect 302→:3002 ✓, SSR home/detalhe ✓.

### Notas / desvios da Fase 6

- **API comprador:** `POST /auth/register`, `POST /auth/recover-password`, `GET/POST /auth/reset-password/:token`, `GET /orders`, `GET /public/banners`; `GET /auth/me` expõe `email`.
- **Storefront:** páginas login/cadastro/recuperar/redefinir, carrinho, checkout, resultado, meus-pedidos, billing; `BannerCarousel` + `AddToCartButton`; middleware protege rotas autenticadas.
- **Proxy API no browser:** rewrites Next `/api/v1/*` → API; `API_URL` vazio no client para cookies same-site (logout/credenciais).
- **Logout:** `POST` com body `{}` (Fastify rejeita JSON vazio); `clearCookie` com `domain=localhost` em dev.
- **test-utils:** export `./test-ids/auth`; storefront importa subpaths (`test-ids/store`, `test-ids/auth`), não o barrel `test-ids/index`.
- **Legacy redirect:** `storefrontRedirect.js` — GET auth/carrinho/checkout/meus-pedidos/billing → `:3002` quando `USE_NEW_STOREFRONT=true`; POST legacy intacto.
- **E2E:** `buyer.setup.ts` via login UI; specs `store/auth|cart|checkout|orders`; projeto `store` serial (`fullyParallel: false`); `outputDir` em `/tmp`.
- **Desvios DoD:** Stripe Elements UI não portado (métodos pix/boleto/teste ok); e-mail recuperação log-only sem SMTP.

### Notas / desvios da Fase 7

- **`packages/db`:** Drizzle ORM + drizzle-kit; baseline `0000_baseline.sql` espelha schema legacy (IF NOT EXISTS, sem alterar dados).
- **Multi-tenant:** opção A — `getCachedTenantDb(slug)` injetado em `request.drizzle` via plugin tenant.
- **API Drizzle:** auth (`usuarios`, `tentativas_login`, `tokens_recuperacao`), public products, admin `listPedidos`. Checkout/cart/admin demais módulos permanecem SQL raw.
- **Makefile:** `db-migrate`, `db-generate`, `db-studio`.
- **Testes:** `packages/db/tests/migrate.test.ts` (baseline + journal); regressão api 112/112; e2e smoke 23/23.
- **Fix:** `package.json` raiz `test:e2e:smoke` → `pnpm --filter e2e test:smoke` (grep não era repassado ao Playwright).
- **Coexistência (Fase 7):** Drizzle baseline idempotente coexistia com legacy até Fase 8.

### Notas / desvios da Fase 8

- **`apps/legacy` removido** — Express/EJS, Jest legacy, `Dockerfile.legacy`, volumes Docker legacy.
- **Stack final:** `make up-d` → api + admin + storefront (:3000) + db; `make up-proxy` → Caddy :8080.
- **Bootstrap API:** migrations Drizzle + auto-provision tenant no boot (`bootstrap.ts`).
- **Seed:** `apps/api/scripts/seed-dev.mjs` + `make seed` / `pnpm seed`.
- **Uploads:** `data/uploads/images` servidos em `/images/*` via `@fastify/static`.
- **Admin/storefront:** imagens via API (`assetImageUrl`); chat Socket.io na API; `VITE_STOREFRONT_URL`.
- **CI:** `.github/workflows/ci.yml` — typecheck + api test + e2e smoke.
- **Desvio:** `admin-clientes.ejs` (showcase logos) descontinuado com legacy — sem equivalente React.
- **Tag sugerida:** `v2.0.0-monorepo`.

### Handoff pós-migração

- Monorepo TS-only: api + admin + storefront + packages.
- SQL raw restante na API (módulos não migrados para Drizzle) — migração gradual opcional.
- Documentação: `docs/ARCHITECTURE.md`, `LEIA-ME.md`.

## Log de entregas

<!-- Formato: YYYY-MM-DD — Fase N — resumo -->
- 2026-06-12 — Fase 8 — **Descomissionar legacy.** Removido `apps/legacy` + Dockerfile. Stack final api/admin/storefront/db. Storefront :3000. Bootstrap API + seed migrados. Uploads `/images/*` na API. CI GitHub Actions. docs/ARCHITECTURE.md + LEIA-ME.md. api 112/112 ✓, e2e 38/38 ✓, smoke 23/23 ✓. Tag sugerida: v2.0.0-monorepo.
- 2026-06-12 — Fase 7 — **Drizzle + migrations.** `packages/db` (`@lojao/db`): schema master+tenant, baseline `0000_baseline.sql`, `db:migrate|generate|studio`. Makefile `db-migrate`. API: auth/public/listPedidos via `request.drizzle`. Runbook `db-migration.md`. vitest db 1/1 ✓, api 112/112 ✓, e2e smoke 23/23 ✓. Fix `test:e2e:smoke` script. Próximo: Fase 8 descomissionar legacy.
- 2026-06-12 — Fase 6 — **Comprador Next.** Auth register/recover/reset + orders + banners API. Storefront fluxo completo (carrinho, checkout teste, meus-pedidos, banner). Legacy redirect comprador. testids store/auth + e2e 6 specs @smoke. vitest api 112/112 ✓. make test-e2e 38/38 ✓. Próximo: Fase 7 Drizzle.
- 2026-06-12 — Fase 5 — **Vitrine Next pública.** `apps/storefront` (home + produto SSR, middleware tenant, SEO). API public store/products. Legacy redirect `USE_NEW_STOREFRONT`. Docker storefront + Caddyfile. testids store + e2e vitrine. vitest public ✓. Próximo: Fase 6 comprador.
- 2026-06-12 — Fase 4 — **API crítica checkout.** Módulos Fastify: cart, shipping, checkout (pix/boleto/cartao/sumup/teste), webhooks Stripe/SumUp, billing, store-chat REST + Socket.io. Feature flags `USE_NEW_*` + proxy legacy. Fixture `seedPedidoTeste` + `loginComprador` em test-utils. vitest 98/98 ✓. typecheck ✓. Docker/env pagamento na API. Rollback: `docs/migration/runbooks/checkout-rollback.md`. Próximo: Fase 5 vitrine Next.
- 2026-06-12 — Fase 3 (concluída, sessão 12) — Módulo **Pedidos detalhe** + expansões **Dashboard** e **Pedidos**. API GET/PATCH pedido, stats expandidos. UI React detalhe/listagem/dashboard. Redirect legacy + 3 EJS removidos. testids `adminPedidoDetail.*`. vitest +12 casos. Playwright expand. **Fase 3 done.** Próximo: Fase 4 checkout API.
- 2026-06-12 — Fase 3 (parcial, sessão 10) — Módulo **Chat** migrado. API REST conversas/mensagens/bot. UI React com socket.io-client → legacy. testids `adminChat.*`. vitest 7 casos. Playwright `chat.spec.ts`. Redirect legacy + EJS removido. **Próximo:** módulo 11 Diagnóstico.
- 2026-06-12 — Fase 3 (parcial, sessão 9) — Módulo **Permissões** migrado. API CRUD admins + toggle ativo. UI React form + tabela. testids `adminPermissoes.*`. vitest 8 casos. Playwright `permissoes.spec.ts`. Redirect legacy + EJS removido. **Próximo:** módulo 10 Chat.
- 2026-06-12 — Fase 3 (parcial, sessão 8) — Módulo **Agenda** migrado. API GET agenda (mês) + PUT config/dias + DELETE dia. UI React calendário + config + dias especiais. testids `adminAgenda.*`. vitest 7 casos. Playwright `agenda.spec.ts`. Redirect legacy admin + EJS removido. API pública checkout permanece legacy. **Próximo:** módulo 9 Permissões.
- 2026-06-12 — Fase 3 (parcial, sessão 7) — Módulo **Relatórios** migrado. API GET relatórios (7 abas) + GET CSV export. UI React com abas/filtros/export. testids `adminRelatorios.*`. vitest 6 casos. Playwright `relatorios.spec.ts`. Redirect legacy + EJS removido. **Próximo:** módulo 8 Agenda.
- 2026-06-12 — Fase 3 (parcial, sessão 6) — Módulo **Configurações** migrado. API GET/PUT `/admin/configuracoes` (estoque, SumUp, frete, agenda). UI React form completo. testids `adminConfiguracoes.*`. vitest 5 casos. Playwright `configuracoes.spec.ts`. Redirect legacy + EJS removido. Diagnóstico permanece legacy (mód. 11). **Próximo:** módulo 7 Relatórios.
- 2026-06-12 — Fase 3 (parcial, sessão 5) — Módulo **Compradores** migrado. API listagem (busca + totais) + detalhe (pedidos/agendamentos/resumo). UI React listagem + ficha. testids `adminCompradores.*`. vitest 6 casos. Playwright `compradores.spec.ts`. Redirect legacy + EJS compradores removidos. **Nota:** `admin-clientes.ejs` (showcase) permanece. **Próximo:** módulo 6 Configurações.
- 2026-06-11 — Fase 3 (parcial, sessão 4) — Módulo **Produtos** migrado. API CRUD + upload múltiplo + estoque + exclusão de imagem. UI listagem com form criar + edição. testids `adminProdutos.*`. vitest 5 casos. Playwright `produtos.spec.ts`. Redirect legacy + EJS removidos. **Próximo:** módulo 5 Compradores.
- 2026-06-11 — Fase 3 (parcial, sessão 3) — Módulo **Aparência** migrado. API GET/PUT `/admin/aparencia` (config `loja_*` + upload logo/favicon). UI React com preview ao vivo. testids `adminAparencia.*`. vitest 5 casos. Playwright `aparencia.spec.ts`. Redirect legacy + EJS removido. **Próximo:** módulo 4 Produtos.
- 2026-06-11 — Fase 3 (parcial, sessão 2) — Módulo **Banners** migrado. API CRUD + multipart (`@fastify/multipart`), toggle ativo, form-options (produtos). UI listagem + form novo/editar. Upload compatível legacy `/images/`. testids `adminBanners.*`. vitest 6 casos. Playwright `banners.spec.ts`. Redirect legacy + EJS removidos. **Próximo:** módulo 3 Aparência.
- 2026-06-11 — Fase 3 (parcial, sessão 1) — Módulo **Categorias** migrado. API CRUD `GET/POST /admin/categorias`, `GET/PUT/DELETE /admin/categorias/:id`. UI React listagem + criar + editar (produtos vinculados). testids `testIds.adminCategorias.*`. vitest 4 casos ✓. Playwright `categorias.spec.ts` (listagem @smoke + criar) ✓. Redirect legacy + EJS removidos. Verificações: typecheck ✓, api 17/17 ✓, legacy Jest 56/56 ✓. **Próximo:** módulo 2 Banners.
- 2026-06-11 — Fase 2 — Primeiro admin React. `apps/admin` (Vite + React 19 + React Router 7 + Tailwind 4 + TanStack Query): login, dashboard (4 cards) e pedidos (tabela read-only paginada). `packages/ui` (Button, Card, Table, Sidebar, LayoutAdmin). API: `GET /api/v1/admin/dashboard/stats` e `GET /api/v1/admin/pedidos` com guard `requireAdmin` (401/403). `data-testid` em login/dashboard/pedidos via `@lojao/test-utils` (`testIds.auth.*`/`testIds.admin.*`), catálogo atualizado. Playwright: `fixtures/auth.setup.ts` + `tests/admin/login.spec.ts` + `pedidos.spec.ts` (`@smoke`) — 5/5 ✓. Docker: serviço `admin` (profile `full`), `Dockerfile.admin`, `make up-full`/`logs-admin`/`test-e2e[-smoke]`. Link "Novo painel" no sidebar EJS legacy (sem testid). Verificações: typecheck ✓, api vitest 13/13 ✓, legacy Jest 56/56 ✓, admin `vite build` ✓, e2e 5/5 ✓.
- 2026-06-11 — Fase 1 — Auth + tenant no Fastify (`/api/v1`). Plugin de sessão próprio compatível com `express-session`/`connect-pg-simple` (cookie `lojao.sid`, tabela `sessao`, assinatura `s:`/HMAC). Rotas `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `GET /tenant/config`. Plugin de tenant (`resolveSlug` + `request.db`/`tenantId`, 404 `TENANT_NOT_FOUND`). Libs `master-db`, `tenant-db` (`getPool`), `session-signature`. CORS credentials. 7 testes vitest+inject (login ok/erro, me anon/auth, logout, tenant config, tenant not-found) — 7/7 ✓. Helper `loginAdmin` em `@lojao/test-utils`. `openapi.yaml` parcial. **Verificação cruzada validada**: API login → legacy `/admin` (200) e legacy login → API `/me` (200). Legacy Jest 56/56 ✓. Typecheck ✓.
- 2026-06-11 — Fase 0 — Monorepo pnpm+Turborepo. Legacy movido para `apps/legacy` (comportamento idêntico, 56 testes Jest passando). `apps/api` Fastify+TS com `GET /health`. Packages `types`, `eslint-config`, `test-utils`. Scaffold `apps/e2e` (Playwright). Docker (`Dockerfile.legacy`, `Dockerfile.api`, `docker-compose.yml`), `Makefile`, `.env.example`, `.gitignore`, `LEIA-ME.md` atualizados. Verificado: `make up` (legacy :3000 + api :3001/health + db), `make test`, `pnpm turbo typecheck`.
