# 🛒 Lojão — Guia de Instalação

Plataforma SaaS de e-commerce multi-tenant. **Monorepo** (pnpm + Turborepo) em migração Strangler Fig:

| App | Stack | Porta |
|-----|-------|-------|
| `apps/legacy` | Express 5 + EJS (temporário até Fase 8) | **3000** |
| `apps/api` | Fastify + TypeScript (auth + tenant + admin) | **3001** |
| `apps/admin` | React 19 + Vite + Tailwind 4 + TanStack Query | **5173** |

> **Migração em andamento:** specs e instruções para agentes/desenvolvedores em [`docs/migration/README.md`](docs/migration/README.md) e [`AGENTS.md`](AGENTS.md).

---

## Pré-requisitos

- **Docker** + **Docker Compose** (para `make up`)
- Para rodar fora do Docker: **Node.js 24+** e **pnpm 10+** (`corepack enable`)

---

## Início rápido (Docker — recomendado)

```bash
make up-full-d   # legacy + api + admin + db (profile full, background)
# ou foreground:
make up-full
```

> **Volumes `node_modules`:** cada serviço tem volume próprio. Ao adicionar pacotes (`pnpm add`), o **entrypoint sincroniza deps automaticamente** na subida do container (hash do `pnpm-lock.yaml`). Se algo falhar: `make admin-install` ou `make deps-sync`.

Acesse:

- Vitrine / Admin legacy: http://localhost:3000 (admin: http://localhost:3000/admin)
- **Admin React (novo):** http://localhost:5173/admin/dashboard
- Health da API: http://localhost:3001/health → `{ "status": "ok", "service": "lojao-api" }`

Credenciais dev (provisionadas automaticamente no boot): **admin@loja.com / admin123**

Outros comandos: `make help` (lista tudo), `make logs`, `make logs-api`, `make down`, `make reset`.

### Seed de desenvolvimento (dados demo)

Popula produtos, compradores, pedidos em vários status, pagamentos, carrinho, banners e billing demo:

```bash
make up-d          # db + legacy + api no ar
make seed          # idempotente (pula se já aplicado)
make seed-fresh    # remove dados [DEV] e recria
```

Fora do Docker: `pnpm seed` ou `pnpm seed:fresh` (exige `DATABASE_URL` apontando para o Postgres).

| Papel | E-mail | Senha |
|-------|--------|-------|
| Admin | admin@loja.com | admin123 |
| Comprador | comprador-test@loja.com | comprador123 |
| Comprador | maria.silva@email.com | comprador123 |
| Comprador | joao.santos@email.com | comprador123 |

Pedidos criados: `pago`, `em_separacao`, `enviado` (com rastreio), `aguardando_pagamento`, `cancelado`, `entregue`. Produtos prefixados com `[DEV]`.

**Dashboard (gráficos Recharts):** após `make seed`, abra `/admin/dashboard` — os 4 gráficos exibem dados do período (padrão 30 dias). Útil para validar E2E `dashboard.spec.ts`.

### API de autenticação (Fase 1)

A API Fastify compartilha a **mesma sessão** do legacy (cookie `lojao.sid`, tabela
`sessao` no Postgres). Para isso, `SESSION_SECRET` **deve ser igual** entre `api` e
`legacy` (o `docker-compose.yml` já garante). Rotas sob `/api/v1`:

```bash
# Login (cria cookie lojao.sid compartilhado com o legacy)
curl -c cookies.txt -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" -H "X-Tenant-Slug: loja" \
  -d '{"email":"admin@loja.com","senha":"admin123"}'

curl -b cookies.txt http://localhost:3001/api/v1/auth/me        -H "X-Tenant-Slug: loja"
curl -b cookies.txt http://localhost:3001/api/v1/tenant/config  -H "X-Tenant-Slug: loja"

# Verificação cruzada: o mesmo cookie é aceito pelo legacy
curl -b cookies.txt http://localhost:3000/admin -o /dev/null -w "%{http_code}\n"  # 200
```

Tenant resolvido por (nesta ordem): sessão → env `TENANT_SLUG` → header `X-Tenant-Slug`
→ subdomínio. Contrato completo em [`apps/api/openapi.yaml`](apps/api/openapi.yaml).
CORS com `credentials` libera `http://localhost:3000`, `:5173` e `:3002`.

### Admin React (Fase 2)

Novo painel admin (read-only nesta fase): **login**, **dashboard** (4 cards) e
**pedidos** (tabela paginada). Consome a API Fastify com `credentials: 'include'`
e header `X-Tenant-Slug`. O legacy `/admin` segue funcionando em paralelo (há um
link "Novo painel" no menu do admin legacy).

```bash
# Com a stack Docker no ar (make up-d), rode o admin localmente:
pnpm --filter admin dev        # http://localhost:5173  (login: admin@loja.com / admin123)

# Ou tudo via Docker (inclui o admin no profile "full"):
make up-full                   # legacy + api + admin + db
```

Rotas admin da API (exigem sessão `role=admin` — 401 sem sessão, 403 se não-admin):

```bash
curl -b cookies.txt "http://localhost:3001/api/v1/admin/dashboard/stats" -H "X-Tenant-Slug: loja"
curl -b cookies.txt "http://localhost:3001/api/v1/admin/pedidos?page=1&perPage=20" -H "X-Tenant-Slug: loja"
```

### Checkout via API (Fase 4)

Rotas críticas migradas para `:3001`. Feature flags no `.env` / `docker-compose.yml`:

```env
USE_NEW_CHECKOUT=false   # true → legacy POST /checkout proxy para API
USE_NEW_CART=false       # true → legacy carrinho proxy para API
USE_NEW_WEBHOOKS=false   # true → webhooks só na API (:3001/webhook/*)
USE_NEW_CHAT=false       # true → Socket.io na API; legacy desliga socket
```

Exemplo fim-a-fim (método `teste`, só dev):

```bash
# Login comprador
curl -c buyer.txt -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" -H "X-Tenant-Slug: loja" \
  -d '{"email":"comprador-test@loja.com","senha":"comprador123"}'

# Adicionar ao carrinho + checkout
curl -b buyer.txt -X POST http://localhost:3001/api/v1/cart/items \
  -H "Content-Type: application/json" -H "X-Tenant-Slug: loja" \
  -d '{"produto_id":1,"quantidade":1}'

curl -b buyer.txt -X POST http://localhost:3001/api/v1/checkout \
  -H "Content-Type: application/json" -H "X-Tenant-Slug: loja" \
  -d '{"nome_entrega":"Teste","email_entrega":"comprador-test@loja.com","cep":"01310-100","logradouro":"Av Paulista","numero":"100","cidade":"São Paulo","estado":"SP","metodo_pagamento":"teste","frete_valor":0}'
```

Webhooks Stripe/SumUp em dev: use [ngrok](https://ngrok.com/) apontando para `http://localhost:3001/webhook/stripe` quando `USE_NEW_WEBHOOKS=true`.

Fixture QA: `seedPedidoTeste()` em `@lojao/test-utils` — ver `packages/test-utils/src/fixtures/README.md`.

### Testes E2E (Playwright)

```bash
make up-full-d                                   # stack completa (inclui admin)
pnpm --filter e2e exec playwright install chromium   # uma vez
make test-e2e-smoke                              # specs @smoke (login → dashboard → pedidos)
```

Detalhes e variáveis em [`apps/e2e/README.md`](apps/e2e/README.md).

---

## Desenvolvimento local (sem Docker)

```bash
pnpm install              # instala todo o monorepo
pnpm --filter legacy dev  # Express em :3000 (Postgres local necessário)
pnpm --filter api dev     # Fastify em :3001
pnpm --filter admin dev   # React/Vite em :5173 (consome a api em :3001)
pnpm turbo typecheck      # checagem de tipos (api + admin + packages)
make test                 # testes do legacy (Jest)
make test-api             # testes de integração da api (vitest) — requer Postgres
make test-all             # legacy (Jest) + api (vitest)
make test-e2e-smoke       # Playwright @smoke (requer stack + browsers)
```

> Os testes da API usam `DATABASE_URL` (default `postgresql://postgres:postgres@localhost:5432/lojao`,
> o mesmo do `make up`). O setup cria o tenant `loja` + admin se faltarem e limpa
> `tentativas_login` (rate-limit) — idempotente; não destrói dados existentes.

O banco/tabelas do legacy são criados no boot (`apps/legacy/config/init-db.js`).
Para banco sem SSL, garanta `PGSSL=disable` no ambiente (o `docker-compose.yml` já define).

---

## Correções aplicadas nesta versão

| Arquivo                            | Problema                                                               | Correção                                 |
| ---------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------- |
| `views/pages/index.ejs`            | HTML duplicado, includes quebrados, produtos não exibidos              | Reescrito corretamente                   |
| `views/pages/error.ejs`            | Arquivo vazio                                                          | Criado página de erro                    |
| `views/partials/header.ejs`        | Arquivo vazio                                                          | Criado header com navbar                 |
| `views/partials/produto-card.ejs`  | Usava `produto.imagem` (não existe)                                    | Corrigido para `produto.primeira_imagem` |
| `views/pages/admin.ejs`            | JS de preview referenciava `id="imagem"` errado                        | Corrigido para `id="imagens"`            |
| `views/pages/editar.ejs`           | Input de arquivo com `name="imagem"` errado                            | Corrigido para `name="imagens"`          |
| `controllers/produtoController.js` | Faltava buscar `primeira_imagem`; valor não era parseado do formato R$ | Corrigido com subquery e parseFloat      |
| `routes/produtoRoutes.js`          | Faltava rota de excluir imagem individual                              | Adicionada `/excluir-imagem/:id`         |
| `package.json`                     | Sem script `start`                                                     | Adicionado `"start": "node server.js"`   |
