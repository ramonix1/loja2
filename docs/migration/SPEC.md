# SPEC — Protocolo de implementação

Especificação mestre para o agente implementador. Cada fase detalhada está em `phases/`.

---

## Protocolo do agente

### Antes de codar

1. Ler [CONTEXT.md](./CONTEXT.md)
2. Ler [STATUS.md](./STATUS.md) — identificar fase ativa
3. Ler [TESTING-IMPLEMENTATION.md](./TESTING-IMPLEMENTATION.md)
4. Ler spec da fase: `phases/XX-*.md` — **incluindo seção de testes**
5. Ler [DEPLOY.md](./DEPLOY.md) — seção da fase atual
6. Ler regra `.cursor/rules/lojao-migration.mdc`

### Durante a implementação

- Implementar **somente** o escopo **IN** da fase
- Implementar seção **「Testes automatizados — como implementar」** da fase (testids, vitest, Playwright conforme aplicável)
- **Não** adicionar `data-testid` nem specs Playwright contra **EJS legacy**
- Não refatorar código legacy além do necessário para a fase
- Preservar testes legacy (`npm test` na raiz ou via `make test`)
- Commits atômicos por entrega lógica (se o usuário pedir commit)
- Documentar desvios na seção "Notas" de `STATUS.md`

### Após concluir a fase

1. Executar **todos** os comandos de verificação da fase
2. Atualizar [STATUS.md](./STATUS.md): fase → `done`, métricas, log
3. Listar no handoff: o que foi feito, o que ficou pendente, riscos para próxima fase

### Em caso de bloqueio

- Marcar fase como `blocked` em STATUS.md
- Descrever bloqueio e opções
- **Não** contornar requisitos de segurança (CSRF, webhooks, sessão)

---

## Estrutura alvo final do monorepo

```
lojao/
├── apps/
│   ├── legacy/              # Express atual (removido na Fase 8)
│   ├── api/                 # Fastify
│   ├── admin/               # React + Vite
│   └── storefront/          # Next.js
├── packages/
│   ├── db/
│   ├── types/
│   ├── ui/
│   └── eslint-config/       # tsconfig base, eslint shared
├── docs/migration/          # este diretório
├── docker/
│   ├── Dockerfile.legacy
│   ├── Dockerfile.api
│   ├── Dockerfile.admin
│   ├── Dockerfile.storefront
│   └── Caddyfile            # proxy dev (Fase 2+)
├── docker-compose.yml
├── docker-compose.override.yml  # opcional dev
├── pnpm-workspace.yaml
├── turbo.json
├── package.json             # root scripts
├── Makefile
└── .env.example
```

---

## Convenções de código

### TypeScript

- `strict: true` em todos os apps/packages TS
- Zod para validação de input HTTP; inferir tipos com `z.infer`
- Evitar `any`; usar `unknown` + narrow quando necessário
- Nomes de arquivos: `kebab-case.ts`; componentes React: `PascalCase.tsx`

### API (Fastify)

- Prefixo global: `/api/v1`
- Formato de erro padrão:

```json
{
  "error": "Mensagem legível",
  "code": "VALIDATION_ERROR",
  "details": []
}
```

- Rotas admin: prefixo `/api/v1/admin/*` + guard `role === 'admin'`
- Rotas públicas vitrine: `/api/v1/public/*` (sem auth)
- Webhooks: `/webhook/stripe`, `/webhook/sumup` — **sem CSRF**, raw body

### Admin (React)

- React Router, layouts aninhados
- TanStack Query para fetch; staleTime padrão 30s
- Tailwind 4; componentes base em `packages/ui`
- Variável `VITE_API_URL` apontando para Fastify

### Storefront (Next)

- App Router; Server Components para listagens públicas
- Middleware Next resolve tenant (mesma lógica que `middlewares/tenant.js`)
- Variável `NEXT_PUBLIC_API_URL`

### Banco (Drizzle — a partir Fase 7)

- Schema espelha tabelas existentes; **não renomear colunas** sem migration
- Migrations em `packages/db/drizzle/`
- Até Fase 6: API pode usar `pg` pool legado portado para TS

### Testes

Intenção: **testes automatizados** em todo o produto (API + UI E2E). Detalhes: [TESTING-STRATEGY.md](./TESTING-STRATEGY.md). **Como implementar por fase:** [TESTING-IMPLEMENTATION.md](./TESTING-IMPLEMENTATION.md) + seção de testes em cada `phases/XX-*.md`.

| App | Ferramenta | Mínimo |
|-----|------------|--------|
| api | vitest + supertest | endpoints da fase |
| legacy | Jest existente | deve continuar passando |
| admin / storefront | Playwright (E2E) + vitest/RTL (opcional) | smoke fluxos críticos |
| packages/ui | vitest + RTL (opcional) | componentes base |

### data-testid (UI — Fase 2+)

- Atributo padrão: **`data-testid`** (não `data-test`)
- Obrigatório em telas React/Next novas: ações, inputs e containers assertáveis
- Convenção: `{app}-{pagina}-{elemento}` — catálogo em [test-ids-catalog.md](./test-ids-catalog.md)
- Legacy EJS: **não** instrumentar retroativamente; só exceção documentada

---

## Formato de resposta da API (contrato)

### Sucesso

```json
{ "data": { ... } }
```

### Lista paginada

```json
{
  "data": [],
  "meta": { "page": 1, "perPage": 20, "total": 100 }
}
```

### Erro HTTP

| Status | code exemplo |
|--------|--------------|
| 400 | `VALIDATION_ERROR` |
| 401 | `UNAUTHORIZED` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` |
| 500 | `INTERNAL_ERROR` |

---

## Sessão compartilhada (Fase 1+)

| Propriedade | Valor |
|-------------|-------|
| Cookie name | `lojao.sid` |
| Store | PostgreSQL tabela `sessao` (banco master) |
| Secret env | `SESSION_SECRET` |
| Campos sessão | `usuarioId`, `nome`, `role`, `tenantSlug`, `tenant_id` |

Legacy Express e Fastify **devem** ler/escrever a mesma tabela e cookie durante a transição.

---

## Mapa de migração EJS → apps

### Admin → `apps/admin` (Fase 2–3)

| EJS | Rota React |
|-----|------------|
| admin-dashboard.ejs | /admin/dashboard |
| admin.ejs + editar.ejs | /admin/produtos |
| admin-categorias.ejs | /admin/categorias |
| admin-pedidos.ejs | /admin/pedidos |
| admin-pedido-detalhe.ejs | /admin/pedidos/:id |
| admin-banners.ejs | /admin/banners |
| admin-aparencia.ejs | /admin/aparencia |
| admin-configuracoes.ejs | /admin/configuracoes |
| admin-relatorios.ejs | /admin/relatorios |
| admin-chat.ejs | /admin/chat |
| admin-agenda.ejs | /admin/agenda |
| admin-compradores.ejs | /admin/compradores |
| admin-permissoes.ejs | /admin/permissoes |
| admin-diagnostico.ejs | /admin/diagnostico |

### Vitrine → `apps/storefront` (Fase 5–6)

| EJS | Rota Next |
|-----|-----------|
| index.ejs | / |
| detail.ejs | /produto/[id] |
| login.ejs | /login |
| cadastro.ejs | /cadastro |
| carrinho.ejs | /carrinho |
| checkout.ejs | /checkout |
| checkout-resultado.ejs | /checkout/resultado/[id] |
| meus-pedidos.ejs | /meus-pedidos |
| recuperar-senha.ejs | /recuperar-senha |
| redefinir-senha.ejs | /redefinir-senha/[token] |
| cliente-billing.ejs | /dashboard/billing |

---

## Índice de fases

| # | Spec | Dependência |
|---|------|-------------|
| 0 | [00-foundation.md](./phases/00-foundation.md) | — |
| 1 | [01-api-auth-tenant.md](./phases/01-api-auth-tenant.md) | Fase 0 |
| 2 | [02-first-admin-react.md](./phases/02-first-admin-react.md) | Fase 1 |
| 3 | [03-admin-modules.md](./phases/03-admin-modules.md) | Fase 2 |
| 4 | [04-critical-api.md](./phases/04-critical-api.md) | Fase 1 (paralelo Fase 3 após sem. 12) |
| 5 | [05-storefront-public.md](./phases/05-storefront-public.md) | Fase 1 |
| 6 | [06-storefront-buyer.md](./phases/06-storefront-buyer.md) | Fase 4 + 5 |
| 7 | [07-drizzle-migrations.md](./phases/07-drizzle-migrations.md) | Fase 4 |
| 8 | [08-decommission-legacy.md](./phases/08-decommission-legacy.md) | Fases 3, 4, 6, 7 |

---

## O que NÃO fazer (global)

- Microserviços ou múltiplos repositórios
- NestJS, GraphQL, tRPC (salvo nova spec)
- Reescrever schema PostgreSQL antes da Fase 7
- Migrar checkout antes da Fase 4
- Remover legacy antes da Fase 8
- Quebrar webhooks de pagamento
- Alterar `SESSION_SECRET` / nome do cookie sem spec de migração de sessão
