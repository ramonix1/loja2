# Fase 1 — API core: auth + tenant

| Campo | Valor |
|-------|-------|
| **ID** | `phase-1` |
| **Depende de** | Fase 0 `done` |
| **Duração estimada** | 1–2 semanas |
| **Deploy** | [DEPLOY.md § Fase 1](../DEPLOY.md#fase-1--api--auth) |

---

## Objetivo

Fastify autentica usuários e resolve tenant usando **a mesma sessão PostgreSQL** do Express. Endpoints mínimos para login e identidade.

---

## Escopo

### IN

- [ ] Plugin `@fastify/session` + `@fastify/cookie` com tabela `sessao` (master DB)
- [ ] Cookie `lojao.sid`, secret `SESSION_SECRET`
- [ ] Middleware/plugin tenant (portar lógica de `apps/legacy/middlewares/tenant.js`)
- [ ] `POST /api/v1/auth/login`
- [ ] `POST /api/v1/auth/logout`
- [ ] `GET /api/v1/auth/me`
- [ ] `GET /api/v1/tenant/config` — configs `loja_*` do tenant
- [ ] Pool tenant (`getPool(slug)`) portado para TS em `apps/api/src/lib/tenant-db.ts`
- [ ] CORS com credentials para origens dev
- [ ] Testes integração (supertest ou vitest + inject)
- [ ] (Opcional) Legacy proxy `/api/v1` → api

### OUT

- Admin React, CRUD produtos, Drizzle, JWT
- **`data-testid` em EJS legacy**
- Playwright contra UI legacy

---

## Testes automatizados — como implementar

### Escopo desta fase

| Tipo | Ação |
|------|------|
| Integração API | **Implementar** — vitest + Fastify inject |
| E2E UI | **Não** — ainda sem telas React |
| Legacy EJS | **Não instrumentar** |

### Setup `apps/api`

```
apps/api/
  vitest.config.ts
  tests/
    helpers/
      build-app.ts       # exporta app Fastify para inject
      session.ts         # helper login → cookie header
    integration/
      auth.login.test.ts
      auth.me.test.ts
      auth.logout.test.ts
      tenant.config.test.ts
      tenant.not-found.test.ts
```

### Casos de teste obrigatórios (implementar exatamente)

| Arquivo | Caso | Assert |
|---------|------|--------|
| `auth.login.test.ts` | POST login credenciais válidas admin | 200, `data.email`, Set-Cookie |
| `auth.login.test.ts` | POST login senha inválida | 401, `code: UNAUTHORIZED` |
| `auth.me.test.ts` | GET /me sem cookie | 401 |
| `auth.me.test.ts` | GET /me após login | 200, `role: admin`, `tenant.slug` |
| `auth.logout.test.ts` | POST logout limpa sessão | GET /me → 401 |
| `tenant.config.test.ts` | GET /tenant/config slug loja | 200, `data.nome` |
| `tenant.not-found.test.ts` | Header slug inexistente | 404, `TENANT_NOT_FOUND` |

### Pré-condição dos testes

- Banco dev com tenant `loja` e admin `admin@loja.com` / `admin123`
- Usar `DATABASE_URL` de teste ou mesmo db dev (documentar se destrutivo)
- Rodar com: `pnpm --filter api test`

### Pronto para o testador

- API auth estável para **fixtures HTTP** (login programático retornando cookie)
- Documentar em `packages/test-utils/src/fixtures/auth.ts`:

```typescript
export async function loginAdmin(apiUrl: string): Promise<string> {
  // fetch POST /api/v1/auth/login → retorna cookie header string
}
```

Testador usa isso em `apps/e2e/fixtures/auth.setup.ts` na Fase 2.

---

## Referência legacy (portar, não reinventar)

| Legacy | Destino API |
|--------|-------------|
| `controllers/authController.js` → login | `apps/api/src/modules/auth/auth.service.ts` |
| `middlewares/tenant.js` | `apps/api/src/plugins/tenant.ts` |
| `config/masterDb.js` | `apps/api/src/lib/master-db.ts` |
| `config/tenantDb.js` | `apps/api/src/lib/tenant-db.ts` |
| Argon2 verify | mesmo fluxo de `processarLogin` |

---

## Contratos API

### POST /api/v1/auth/login

Body (Zod):
```typescript
{ email: string; senha: string }
```

Response 200:
```json
{ "data": { "id": 1, "nome": "...", "email": "...", "role": "admin" } }
```

Set-Cookie: `lojao.sid=...`

### GET /api/v1/auth/me

Requer sessão. 401 se não autenticado.

Response:
```json
{
  "data": {
    "usuario": { "id": 1, "nome": "...", "role": "admin" },
    "tenant": { "slug": "loja" }
  }
}
```

### GET /api/v1/tenant/config

Requer tenant resolvido. Response:
```json
{
  "data": {
    "nome": "Lojão",
    "cor_primaria": "#2563eb",
    "logo": "",
    "slogan": ""
  }
}
```

---

## Sessão — campos obrigatórios

Compatíveis com legacy (`req.session`):

```typescript
interface SessionData {
  usuarioId?: number;
  nome?: string;
  role?: 'admin' | 'usuario';
  tenantSlug?: string;
  tenant_id?: number;
  redirecionarPara?: string;
}
```

Login bem-sucedido deve popular os mesmos campos que `authController.processarLogin`.

---

## Resolução tenant (ordem)

1. `session.tenantSlug`
2. `process.env.TENANT_SLUG`
3. Header `X-Tenant-Slug`
4. Subdomínio do hostname

Injetar `request.tenantSlug` e `request.db` (pool) em rotas autenticadas.

---

## Critérios de aceite (DoD)

- [ ] Login via curl/Postman cria cookie válido
- [ ] `GET /me` retorna usuário após login
- [ ] Login no **legacy** e `GET /me` na **api** compartilham sessão (mesmo cookie enviado)
- [ ] Login na **api** e navegação no **legacy** reconhece usuário (teste cruzado)
- [ ] Tenant incorreto → 404 `{ code: 'TENANT_NOT_FOUND' }`
- [ ] Testes automatizados ≥ 5 casos (login ok, senha errada, logout, me anon, tenant config)
- [ ] Legacy inalterado para usuário final
- [ ] STATUS.md: Fase 1 → `done`

---

## Verificação

```bash
# Login
curl -c cookies.txt -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Slug: loja" \
  -d '{"email":"admin@loja.com","senha":"admin123"}'

# Me
curl -b cookies.txt http://localhost:3001/api/v1/auth/me -H "X-Tenant-Slug: loja"

# Legacy com mesmo cookie
curl -b cookies.txt http://localhost:3000/admin -o /dev/null -w "%{http_code}\n"
```

---

## Handoff Fase 2

- Client fetch documentado (credentials: 'include')
- OpenAPI partial em `apps/api/openapi.yaml` (auth + tenant)
- CORS origins listados no README
