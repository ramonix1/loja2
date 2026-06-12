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
make up        # sobe legacy + api + db (build)
# ou em background:
make up-d
```

Acesse:

- Vitrine / Admin legacy: http://localhost:3000 (admin: http://localhost:3000/admin)
- Health da API: http://localhost:3001/health → `{ "status": "ok", "service": "lojao-api" }`

Credenciais dev (provisionadas automaticamente no boot): **admin@loja.com / admin123**

Outros comandos: `make help` (lista tudo), `make logs`, `make logs-api`, `make down`, `make reset`.

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
