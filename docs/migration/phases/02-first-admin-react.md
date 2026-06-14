# Fase 2 — Primeiro módulo admin React

| Campo | Valor |
|-------|-------|
| **ID** | `phase-2` |
| **Depende de** | Fase 1 `done` |
| **Duração estimada** | 2–3 semanas |
| **Deploy** | [DEPLOY.md § Fase 2](../DEPLOY.md#fase-2--admin-react) |

---

## Objetivo

Provar fluxo ponta a ponta: **Admin React → Fastify API → PostgreSQL**. Entregar dashboard + listagem de pedidos (read-only). Legacy admin paralelo até Fase 3.

---

## Escopo

### IN

- [ ] `apps/admin/` — Vite + React 19 + TypeScript + React Router 7
- [ ] Tailwind CSS 4 configurado
- [ ] TanStack Query para data fetching
- [ ] `packages/ui/` — componentes mínimos: `Button`, `Card`, `Table`, `Sidebar`, `LayoutAdmin`
- [ ] Página login `/login` (admin app)
- [ ] Layout admin com sidebar espelhando `views/partials/admin-sidebar.ejs`
- [ ] `/admin/dashboard` — stats cards
- [ ] `/admin/pedidos` — tabela paginada (read-only)
- [ ] API:
  - `GET /api/v1/admin/dashboard/stats`
  - `GET /api/v1/admin/pedidos?page=&perPage=`
- [ ] Guard: rotas `/admin/*` exigem sessão + `role=admin`
- [ ] Docker service `admin` (opcional profile) + Makefile targets
- [ ] Link no legacy EJS: "Novo painel" → `http://localhost:5173/admin/dashboard`
- [ ] **`data-testid`** nas telas login, dashboard e pedidos (ver [TESTING-STRATEGY.md](../TESTING-STRATEGY.md))
- [ ] Entradas iniciais em [test-ids-catalog.md](../test-ids-catalog.md)
- [ ] Scaffold **`apps/e2e`** operacional com spec smoke admin (não opcional)
- [ ] Constantes testid em `@lojao/test-utils` (não strings duplicadas)

### OUT

- CRUD pedidos, outros módulos admin, Next.js, edição de status pedido
- **`data-testid` / Playwright no EJS legacy**

---

## API — contratos

### GET /api/v1/admin/dashboard/stats

Auth: admin. Response:
```json
{
  "data": {
    "pedidos_hoje": 0,
    "pedidos_pendentes": 0,
    "receita_mes": 0,
    "produtos_ativos": 0
  }
}
```

Portar queries de `produtoController.dashboard` e `checkoutController.adminPedidos`.

### GET /api/v1/admin/pedidos

Query: `page` (default 1), `perPage` (default 20), `status?`

Response paginada conforme SPEC.md.

Campos mínimos por pedido: `id`, `created_at`, `status`, `total`, `cliente_nome`, `cliente_email`

---

## Admin app — estrutura

```
apps/admin/
  src/
    main.tsx
    App.tsx
    routes/
      login.tsx
      admin/
        layout.tsx
        dashboard.tsx
        pedidos.tsx
    lib/
      api-client.ts      # fetch + credentials + X-Tenant-Slug
      auth-context.tsx
    components/
packages/ui/
  src/
    button.tsx
    card.tsx
    table.tsx
    sidebar.tsx
```

### api-client.ts

```typescript
const API_URL = import.meta.env.VITE_API_URL;
// fetch(url, { credentials: 'include', headers: { 'X-Tenant-Slug': slug } })
```

Tenant slug dev: `import.meta.env.VITE_TENANT_SLUG` default `loja`

---

### data-testid mínimos (Fase 2)

| testid | Elemento |
|--------|----------|
| `auth-login-email-input` | Input e-mail |
| `auth-login-password-input` | Input senha |
| `auth-login-submit-btn` | Botão entrar |
| `admin-dashboard-stats` | Container stats |
| `admin-pedidos-table` | Tabela pedidos |
| `admin-pedidos-row-{id}` | Linha (id dinâmico) |
| `admin-sidebar-nav` | Nav lateral |

Constantes em `packages/test-utils/src/test-ids/admin.ts` e `auth.ts`.

---

## Testes automatizados — como implementar

### Escopo desta fase

| Tipo | Ação |
|------|------|
| data-testid | **Obrigatório** — login, dashboard, pedidos (tabela acima) |
| Playwright E2E | **Implementar** specs smoke admin |
| API integração | Testes `GET /admin/dashboard/stats` e `GET /admin/pedidos` |
| Legacy EJS | **Não** adicionar testid; link "Novo painel" ok |

### 1. Instrumentar UI (dev front)

Em **cada** elemento da tabela, usar constante de `@lojao/test-utils`:

```tsx
// apps/admin/src/routes/login.tsx
<input data-testid={testIds.auth.loginEmail} ... />
```

Estados obrigatórios com testid:
- `admin-pedidos-empty-state` — tabela vazia
- `admin-pedidos-loading` — skeleton/spinner
- `auth-login-error-msg` — credencial inválida

Atualizar [test-ids-catalog.md](../test-ids-catalog.md).

### 2. Testes API (dev back)

```
apps/api/tests/integration/admin.dashboard.test.ts
apps/api/tests/integration/admin.pedidos.test.ts
```

| Caso | Assert |
|------|--------|
| GET stats como admin | 200, campos numéricos |
| GET stats sem auth | 401 |
| GET stats como usuario | 403 |
| GET pedidos paginado | 200, `meta.total`, `data[]` |

### 3. Specs Playwright (implementar — testador expande depois)

**`apps/e2e/tests/admin/login.spec.ts`**

```typescript
test('admin login @smoke', async ({ page }) => { ... });
test('admin login credencial invalida', async ({ page }) => {
  // assert auth-login-error-msg visible
});
```

**`apps/e2e/tests/admin/pedidos.spec.ts`**

```typescript
test('lista pedidos @smoke', async ({ page }) => {
  // usar storageState ou login inline
  await page.goto('/admin/pedidos');
  await expect(page.getByTestId('admin-pedidos-table')).toBeVisible();
});
```

**`apps/e2e/fixtures/auth.setup.ts`** — login via UI ou API helper Fase 1; salvar `.auth/admin.json`.

### Variáveis E2E

```env
E2E_BASE_URL=http://localhost:5173
E2E_API_URL=http://localhost:3001
E2E_TENANT_SLUG=loja
E2E_ADMIN_EMAIL=admin@loja.com
E2E_ADMIN_PASSWORD=admin123
```

Documentar em `apps/e2e/README.md`.

### Comandos

```bash
make up-d                            # legacy + api + admin + db
pnpm --filter api test
pnpm test:e2e:smoke                  # roda @smoke
```

### Pronto para o testador

- Specs smoke passando localmente
- Catálogo testids preenchido (auth + admin pedidos/dashboard)
- Pode adicionar casos (filtros, paginação) **sem** pedir novos testids se usar os existentes

---

## UX mínima

- Dashboard: 4 cards com números
- Pedidos: tabela com status badge (cores similares ao EJS)
- Loading e error states com TanStack Query
- Redirect `/admin/*` → `/login` se 401

---

## Critérios de aceite (DoD)

- [ ] `pnpm --filter admin dev` — app abre em `:5173`
- [ ] Login admin funciona contra API
- [ ] Dashboard exibe dados reais do tenant `loja`
- [ ] Listagem pedidos exibe pedidos reais (ou empty state)
- [ ] Usuário não-admin recebe 403 na API
- [ ] Legacy `/admin/pedidos` ainda funciona
- [ ] `data-testid` presentes conforme tabela acima; catálogo atualizado
- [ ] (QA) Playwright smoke: login → dashboard → pedidos passa localmente
- [ ] `apps/e2e/tests/admin/login.spec.ts` e `pedidos.spec.ts` implementados
- [ ] `apps/e2e/README.md` com env e comandos
- [ ] `docker compose --profile full up` sobe legacy + api + admin + db (se profile implementado)
- [ ] STATUS.md: Fase 2 → `done`

---

## Verificação

```bash
pnpm --filter admin dev
# Browser: login → dashboard → pedidos
curl -b cookies.txt "http://localhost:3001/api/v1/admin/pedidos" -H "X-Tenant-Slug: loja"
make test-api  # se existir
```

---

## Handoff Fase 3

- `packages/ui` documentado
- Padrão de rota admin + hook `useAuth` estabelecido
- Template para CRUD (form + list) definido
