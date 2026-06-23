# Status — Ata Labs Platform

> **Agente implementador:** atualize este arquivo ao concluir cada fase.

## Fase ativa

| Campo | Valor |
|-------|-------|
| **Fase ativa** | — |
| **Concluída em** | 2026-06-22 (Fase G) |
| **Responsável** | agente |

## Progresso por fase

| Fase | Nome | Status | Data conclusão | Notas |
|------|------|--------|----------------|-------|
| A | Infra DNS + CDN R2 | `done` | 2026-06-19 | DNS Cloudflare + Render sem limite (humano); código `assetUrl` CDN, `render.yaml`, runbook |
| B | Migração URLs imagens | `done` | 2026-06-19 | **Dispensada** — produtos e demais registros com `/images/` já removidos da base; Fase A cobre uploads novos |
| C | Branding UI | `done` | 2026-06-22 | Admin Figtree + tokens azul/verde; favicon; grep zero Lojão UI; seed/API defaults |
| D | Multi-tenant path | `done` | 2026-06-19 | `@lojao/tenant-host`, `/store/[slug]`, redirects 301, e2e atualizado |
| E | Login admin tenant | `done` | 2026-06-19 | Slug no login + sessão; admin sem `VITE_TENANT_SLUG` prod |
| F | Platform Hub | `done` | 2026-06-19 | `/platform/*` + API CRUD tenants; role `platform_admin` |
| **G** | Onboarding self-service | `done` | 2026-06-22 | API pública `/public/signup` (check-slug, preview, signup, plans); tenant + admin + trial 14d; reusa Fase F; idempotência + rate limit |
| **H** | Merchant Hub (login sem slug) | `done` | 2026-06-22 | `/admin/my-stores` · login cross-tenant · select-tenant |

Status permitidos: `pending` | `in_progress` | `blocked` | `done`

## Bloqueios / decisões pendentes

- **Próxima fase recomendada (platform):** G.2 (gateway real + webhook de billing) ou polish self-service (e-mail boas-vindas, auto-login one-time)
- **M7 concluído (2026-06-22):** UI `/signup`, `/signup/checkout`, `/signup/success` no storefront + CTAs `/pricing` → checkout (ver [storefront-marketing-STATUS.md](./storefront-marketing-STATUS.md))
- **Design system:** [design-system.md](./design-system.md) · `@lojao/design-tokens`
- **Self-service:** modelo de negócio padrão — ver Fase G + M7; checkout/success saem do “fora de escopo”
- **Assumção Fase F (dev/test):** tenants compartilham o banco `DATABASE_URL` (ver `tenant-db.ts` singleDbUrl), então o provisionamento só roda migrations em **produção** (bancos separados). Isolamento real de dados entre tenants depende de bancos distintos em produção.

## Log de entregas

### 2026-06-22 — Fase G — API self-service de onboarding

- API pública `/api/v1/public/signup` (sem tenant, sem sessão lojista; isenta no hook `v1.ts`):
  - `GET /public/signup/plans` — mirror dos planos de marketing (starter/professional/enterprise) + preço anual
  - `GET /public/signup/check-slug?slug=` — `available` + `reason` (`RESERVED` | `TAKEN`)
  - `POST /public/signup/preview` — valida Zod sem persistir; `409 SLUG_RESERVED`/`SLUG_EXISTS`; `422 ENTERPRISE_CONTACT`
  - `POST /public/signup` — provisiona tenant + admin + trial 14d → `201 { tenantSlug, lojaNome, adminEmail, storefrontUrl, adminUrl, trialEndsAt }`
- Provisionamento reusa `createTenant` (Fase F): tenant no master + admin role `admin` no tenant + config mínima (`loja_nome`, cor `#0D5FE0`) com `ON CONFLICT DO NOTHING` (banco compartilhado em dev/test)
- Billing trial: `tenant_billing` status `trialing` + `trial_ends_at` (+14d); plano fixo semeado em `billing_plans`; cobrança real é **stub** (log) — G.2 fará gateway/webhook
- Enterprise: sem auto-provision → `422 ENTERPRISE_CONTACT`
- Segurança: rate limit por IP em memória (off em test); slugs reservados; sem stack trace
- Idempotência: header `Idempotency-Key` ou hash `email+slug` (cache em memória — G.2 troca por store compartilhado)
- Tipos/schemas em `packages/types/src/signup.ts` (`@lojao/types/signup`)
- vitest `public.signup.test.ts` (10 casos: plans, check-slug, preview, happy path, duplicado, reservado, enterprise, idempotência) → **api 153/153 ✓**; typecheck ✓
- Fora de escopo (entregue depois): UI storefront `/signup/*` (M7), gateway produção (G.2), auto-login pós-signup

### 2026-06-22 — Fase C — Branding Ata Commerce (admin + defaults)

- Admin: Figtree via Google Fonts; `@lojao/design-tokens/tokens.css`; paleta azul (lojista) e verde (platform)
- Telas branded: login (`admin-login-brand`), my-stores, platform login; sidebar/layout com tokens oficiais
- Favicon SVG Ata Commerce (`apps/admin/public/favicon.svg`)
- API defaults: `loja_nome` → "Ata Commerce Demo"; cor primária `#0D5FE0`; bootstrap tenant demo
- `.env.example`: `EMAIL_FROM="Ata Commerce <noreply@atalabs.com.br>"`; OpenAPI → "Ata Commerce API"
- Grep UI: zero "Lojão" em `apps/admin/src` e `apps/storefront/src/app/(marketing)`
- `AtaCommerceWordmark` storefront corrigido (azul); typecheck ✓; api 143/143 ✓

### 2026-06-22 — Fase H — Merchant Hub (login sem slug)

- API auth Merchant Hub:
  - `POST /auth/login` sem `tenantSlug` → `step: ready | select_tenant` ou `NO_TENANT_ACCESS`
  - `POST /auth/select-tenant`, `GET /auth/my-stores`, `POST /auth/clear-tenant`
  - `findAdminTenantsWithEmail` filtra `role = admin`; guards `TENANT_NOT_SELECTED` + `requireMerchantAdmin`
- Admin: login só e-mail/senha; hub **`/admin/my-stores`**; sidebar **Trocar loja**; redirects pós-login
- testids `merchant-hub-*`; vitest `auth.merchant-hub.test.ts` → **api 143/143 ✓**
- E2E `admin/login.spec.ts` (sem slug) + `admin/merchant-hub.spec.ts` (trocar loja)
- `admin-login-slug-input` deprecado no catálogo; login com slug explícito mantido na API

### 2026-06-22 — Specs G, H, M7 + Fase C checklist

- **Fase C:** checklist DoD com ✅ parcial (tokens, landing, títulos admin) e 🔲 pendente (Figtree admin, grep “Lojão”, favicon, seed, `EMAIL_FROM`)
- **Fase G** — [storefront-onboarding-spec.md](./storefront-onboarding-spec.md): self-service `/signup` → checkout → success; API `POST /public/signup`; trial 14d
- **Fase H** — [admin-merchant-hub-spec.md](./admin-merchant-hub-spec.md): login **sem slug**; hub **`/admin/my-stores`**; multi-loja
- **M7** — UI checkout/success storefront (depende G + H + C)
- Platform spec v1.1: diagrama deps A→H→G→M7; seções Fases G e H
- Decisão produto: **self-service** é o modelo de negócio alvo (substitui fluxo manual via `/platform`)

### 2026-06-19 — Fase F — Platform Hub + API tenants

- Role `platform_admin` na sessão (`session.ts`); guard `requirePlatformAdmin` (`auth-guard.ts`)
- API `apps/api/src/modules/platform/`:
  - `POST /api/v1/platform/login` — autentica operador via `MASTER_EMAIL`/`MASTER_PASSWORD` (timing-safe); sessão sem tenant
  - `GET /platform/tenants`, `POST /platform/tenants`, `GET /platform/tenants/:slug`, `PATCH /platform/tenants/:slug` (suspender/renomear/plano; sem hard delete)
  - Guard `role === 'platform_admin'`; respostas `{ data }` / `{ error, code }`
- `v1.ts` hook: `/platform/*` ignora tenant; `/auth/me` e `/auth/logout` usam `softTenantPreHandler` (tenant opcional p/ sessão platform)
- Provisionamento reutiliza `runMigrations` (só em produção; dev/test compartilha banco)
- Tipos em `packages/types/platform.ts` (Zod + `PlatformTenant`)
- Admin: rotas `/platform/*` com layout próprio (Ata Labs), lista/criar/detalhe; `/platform/login`; `ProtectedRoute` role-based + `RootRedirect`
  - lojista → `/admin/dashboard`; `platform_admin` → `/platform/tenants`
- testids `platform-*` no catálogo; vitest platform (401/403/login/CRUD/validação/404) → **api 135/135 ✓**
- E2E `apps/e2e/tests/admin/platform.spec.ts` (login master, criar tenant + vitrine acessível, lojista bloqueado)
- `render.yaml`: `MASTER_EMAIL`/`MASTER_PASSWORD` (`sync: false`); `.env.example` E2E master
- typecheck ✓, admin build ✓

**Credenciais master (produção):** `MASTER_EMAIL` / `MASTER_PASSWORD` definidos no Render (sem default no código — login retorna 503 se ausentes). Exemplo de tenant criado nos testes: `acme-test` (removido no teardown).

### 2026-06-19 — Fase E — Login admin multi-tenant

- API `POST /auth/login`: body `tenantSlug` opcional + auto-resolve por e-mail único; `loginTenantPreHandler`
- Sessão: `session.tenantSlug` setado no login; logout destrói sessão
- `GET /auth/me`: retorna `tenant.slug` + `tenant.lojaNome`
- Bootstrap: provisiona tenant `demo` (+ `TENANT_SLUG` env se definido); admin padrão `admin@loja.com` / `admin123`
- Admin: campo slug (`admin-login-slug-input`); API client sem `X-Tenant-Slug` fixo (sessão)
- Link **Ver vitrine** no sidebar (`admin-view-storefront-link`) via `buildStorePath`
- `render.yaml`: removido `VITE_TENANT_SLUG` do admin; API bootstrap `TENANT_SLUG=demo`
- Vitest auth login/me: 129/129 ✓; E2E admin login atualizado com slug

**Credenciais demo (produção pós-deploy):** slug `demo`, e-mail/senha conforme `ADMIN_EMAIL` / `ADMIN_SENHA` no Render (default bootstrap `admin@loja.com` / `admin123`).

### 2026-06-19 — Fase D — Multi-tenant `/store/[slug]`

- `packages/tenant-host`: `parseStorePath`, `buildStorePath`, `getDefaultStoreSlug` + vitest 11/11
- Storefront: rotas tenant em `app/store/[slug]/` (home, produto, carrinho, checkout, auth, pedidos, billing)
- `/` = landing stub Ata Labs; vitrine em `/store/{slug}`
- Middleware: slug via path + redirects 301 legado (`/produto/*`, `/carrinho`, etc.)
- API `resolveSlug`: sessão > header; `TENANT_SLUG` ignorado em produção (warn)
- `render.yaml`: removido `TENANT_SLUG`/`NEXT_PUBLIC_TENANT_SLUG` do storefront; `NEXT_PUBLIC_DEFAULT_STORE_SLUG=demo`
- Admin: links vitrine via `storefrontProductUrl` / `storefrontStorePath`
- E2E store atualizado para `/store/loja/...`; testid `store-slug-layout`
- api 127/127 ✓, typecheck ✓, storefront build ✓

### 2026-06-19 — Fase B — Migração URLs imagens CDN (dispensada)

- Escopo original: script Postgres `/images/...` → URL absoluta CDN.
- **Decisão:** fase marcada `done` sem script — produtos e demais registros com path legado já foram deletados da base em uso; não há dados a migrar.
- Uploads novos já retornam URL CDN via `R2_DELIVERY=cdn` (Fase A); `assetUrl()` / `assetImageUrl()` inalterados.
- Implementação temporária do script (sessão anterior) **revertida** do repositório.

### 2026-06-19 — Fase A — Infra DNS + CDN R2

- DNS Cloudflare e custom domains Render configurados manualmente
- `render.yaml`: `R2_DELIVERY=cdn`, `R2_PUBLIC_URL`, URLs Ata Labs fixas
- Storefront: `assetUrl()` usa `NEXT_PUBLIC_CDN_URL`; `/images/*` redireciona 301 para CDN
- Admin: `assetImageUrl()` usa `VITE_CDN_URL`
- API: GET `/images/*` em modo CDN → redirect 301 (sem ler R2/disco)
- `.env.example` e runbook Render atualizados
- **Pendente pós-deploy:** Manual Deploy API → admin → storefront; validar Network tab (só `cdn.atalabs.com.br`)
