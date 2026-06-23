# Contexto do produto — Lojão

Documento de referência para agentes e desenvolvedores. Descreve **o que existe hoje** e **para onde vamos**.

---

## O que é o Lojão

**Lojão** (`package.json`: `lojao`) é uma **plataforma SaaS de e-commerce multi-tenant** para PMEs brasileiras.

Cada **tenant** = uma loja virtual independente com:

- Vitrine pública (produtos, categorias, banners)
- Carrinho e checkout (Stripe, Mercado Pago, SumUp)
- Painel admin (produtos, pedidos, aparência, relatórios, chat, agenda)
- Billing da plataforma (planos, faturas, comissões sobre vendas)

### Usuários

| Persona | Descrição |
|---------|-----------|
| **Comprador** | Cliente final da loja; cadastro, carrinho, checkout, meus pedidos |
| **Admin da loja** | Lojista; gerencia produtos, pedidos, configurações |
| **Super admin** | Operador da plataforma; billing, tenants (dev: `/_tenants`) |

### Público-alvo e UX (mobile-first)

O **público principal** são **pequenos negócios e vendedores autônomos** no Brasil — pessoas que vendem pelo WhatsApp, Instagram ou balcão e não são “power users” de software.

**Implicações para produto e UI:**

| Princípio | Decisão |
|-----------|---------|
| **Mobile-first** | Projetar telas primeiro para celular (touch, legibilidade, uma mão); desktop é expansão, não o default |
| **Simplicidade** | Poucos passos, linguagem do dia a dia, evitar jargão técnico (ex.: slug só como URL da vitrine, não no login) |
| **Alvos de toque** | Botões e cards com altura mínima ~48px; áreas clicáveis generosas |
| **Layout** | Preferir **blocos/cards em grid** a listas densas; telas auth/hub **full-screen**, não cards centralizados estreitos |
| **Contexto de uso** | Uso intermitente no celular (entre atendimentos); carregamento e feedback claros |

Referência de implementação: Merchant Hub (`/admin/my-stores`), login admin, painel lojista. Detalhes: [`docs/design/UX-PRINCIPLES.md`](../design/UX-PRINCIPLES.md).

## Stack atual (legacy)

| Camada | Tecnologia |
|--------|------------|
| Runtime | Node.js 24 |
| Framework | Express 5 |
| Views | EJS (~34 páginas em `views/pages/`) |
| Banco | PostgreSQL 16 (`pg`, SQL manual) |
| Sessão | `express-session` + `connect-pg-simple` (tabela `sessao` no banco master) |
| CSRF | `csrf-sync` |
| Auth | Argon2, roles `admin` / `usuario` |
| Realtime | Socket.io (`config/socketio.js`) |
| CSS | Tailwind via CDN + `public/css/` |
| Testes | Jest + Supertest |
| DevOps | Docker Compose, Makefile |

### Entry point

- `server.js` — monta middlewares, rotas, Socket.io, listen `:3000`

### Multi-tenant

1. Banco **master** (`config/masterDb.js`): tabela `tenants`, `sessao`
2. Por tenant: pool dedicado (`config/tenantDb.js`) com schema próprio
3. Resolução do slug (`middlewares/tenant.js`):
   - `req.session.tenantSlug` → `TENANT_SLUG` (env) → header `X-Tenant-Slug` → subdomínio
4. Provisionamento automático no boot (`config/init-db.js` + `config/tenantSchema.js`)

### Estrutura legacy

```
loja2/                          # raiz (virará monorepo)
├── server.js
├── controllers/     (14 controllers)
├── routes/          (16 routers)
├── services/        (email, stripe, mercadopago, sumup, frete, billing, sms)
├── middlewares/     (auth, tenant, upload, rateLimiter, validation)
├── config/          (db, masterDb, tenantDb, tenantSchema, socketio, init-db)
├── views/pages/     (34 templates EJS)
├── public/          (css, uploads)
├── tests/           (unit + integration)
├── scripts/         (migrations billing, seeds, criar tenant)
├── docker-compose.yml
├── Dockerfile
└── Makefile
```

### Integrações externas

| Serviço | Uso | Variáveis |
|---------|-----|-----------|
| Stripe | Cartão + webhooks | `STRIPE_SECRET_KEY`, etc. |
| SumUp | Checkout cartão | webhooks `/webhook/sumup` |
| Mercado Pago | PIX, cartão, boleto | `MP_ACCESS_TOKEN` |
| Melhor Envio | Frete PAC/SEDEX | token por loja (config) |
| ViaCEP | Endereço | API pública |
| Nodemailer | E-mail transacional | `EMAIL_*` |
| Twilio | SMS (opcional) | `TWILIO_*` |

### Rotas críticas (não quebrar)

- Checkout: `POST /checkout`, webhooks sem CSRF
- Auth: `/login`, `/cadastro`, sessão cookie `lojao.sid`
- Admin: `/admin/*`
- Billing API: `/admin/api/billing/*`, `/api/billing/*`
- Chat: Socket.io + `/admin/chat/*`

---

## Stack alvo

| App | Stack | Porta dev |
|-----|-------|-----------|
| `apps/legacy` | Express + EJS (temporário) | 3000 |
| `apps/api` | Fastify 5 + TypeScript + Zod | 3001 |
| `apps/admin` | React 19 + Vite + TanStack Query | 5173 |
| `apps/storefront` | Next.js 15 App Router | 3002 |
| `packages/db` | Drizzle ORM + drizzle-kit | — |
| `packages/types` | Zod schemas → tipos TS | — |
| `packages/ui` | Componentes React compartilhados | — |

### Decisões fechadas (não reabrir sem aprovação)

- **Backend:** Fastify (não NestJS)
- **Admin:** React + Vite (não Next para admin)
- **Vitrine:** Next.js (SSR/SEO)
- **Banco:** PostgreSQL (mesmo banco, mesmo multi-tenant)
- **Migração:** Strangler Fig — legacy convive até Fase 8
- **Package manager:** pnpm workspaces + Turborepo
- **Auth na transição:** mesma sessão PostgreSQL + cookie `lojao.sid`

### Time (3 pessoas + migração)

| Papel | Foco |
|-------|------|
| Dev front + integração | Admin React, Next vitrine, `packages/ui`, **`data-testid` em UI** |
| Dev back (PHP → TS) | Fastify, serviços, Drizzle, webhooks, tenant, **testes integração API** |
| **Testador QA** | **Playwright E2E**, catálogo de casos, revisão de `data-testid`, CI de regressão |

### Testes automatizados (intenção)

O produto terá cobertura automatizada em camadas (unit → integração API → E2E UI). A migração para React/Next é o ponto de instrumentação com **`data-testid`**. Ver [TESTING-STRATEGY.md](./TESTING-STRATEGY.md).

---

## Princípios da migração

1. **Uma fase por vez** — critérios de aceite antes de avançar
2. **Legacy continua no ar** — zero downtime de funcionalidade existente
3. **API antes da UI** — cada tela nova consome Fastify
4. **Checkout por último** (Fase 4) — após auth/tenant estáveis
5. **Sem mudança de schema** até Fase 7 — Drizzle espelha tabelas existentes
6. **Testes** — legacy Jest intacto; UI nova com `data-testid`; API com testes integração por fase
7. **Idioma** — código/comentários em pt-BR quando alinhado ao projeto; commits em pt-BR

---

## Referências no repositório

| Documento | Conteúdo |
|-----------|----------|
| `LEIA-ME.md` | Setup dev (Docker completo ou híbrido), credenciais dev |
| `BILLING_SETUP.md` | Modelo de billing SaaS |
| `TESTING.md` | Jest, coverage |
| `.env.example` | Variáveis de ambiente |
