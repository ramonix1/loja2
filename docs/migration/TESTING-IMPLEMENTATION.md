# Testes automatizados — guia de implementação por fase

Complementa [TESTING-STRATEGY.md](./TESTING-STRATEGY.md). Cada fase em `phases/` possui seção **「Testes automatizados — como implementar」** com detalhes; este documento consolida o **o quê**, **como** e **o que fica pronto para o testador**.

---

## Regra global: legacy EJS

| Onde | Testes / data-testid |
|------|----------------------|
| **`apps/legacy` (EJS)** | **Não** adicionar `data-testid`; **não** criar Playwright contra EJS |
| **`apps/api`** | Testes integração (vitest + inject) desde Fase 1 |
| **`apps/admin` / `apps/storefront`** | `data-testid` + Playwright desde que a tela existir |

O testador QA automatiza **somente UI nova** (React/Next). Legacy continua coberto por Jest existente até remoção (Fase 8).

---

## Ferramentas (decisão fechada)

| Camada | Ferramenta | Pasta |
|--------|------------|-------|
| API integração | **vitest** + `app.inject()` (Fastify) | `apps/api/tests/integration/` |
| API unit | vitest | `apps/api/tests/unit/` |
| E2E UI | **Playwright** | `apps/e2e/` (monorepo root app) |
| Test ids compartilhados | TS constants | `packages/test-utils/src/test-ids/` |
| Fixtures / seed | scripts + helpers | `packages/test-utils/src/fixtures/` |
| Legacy | Jest (mantido) | `apps/legacy/tests/` |

---

## Estrutura alvo `apps/e2e/` (scaffold Fase 0, specs Fase 2+)

```
apps/e2e/
  package.json
  playwright.config.ts
  tests/
    admin/
      login.spec.ts          # @smoke — Fase 2
      pedidos.spec.ts        # Fase 2
    store/
      vitrine.spec.ts        # @smoke — Fase 5
      checkout.spec.ts       # @smoke — Fase 6
  pages/                     # Page Objects (opcional, recomendado Fase 6)
    admin-login.page.ts
    checkout.page.ts
  fixtures/
    auth.setup.ts            # storageState admin + comprador
```

### playwright.config.ts (padrão)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    testIdAttribute: 'data-testid',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'admin',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/admin.json' },
      dependencies: ['setup'],
      testMatch: /admin\/.*\.spec\.ts/,
    },
    {
      name: 'store',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.E2E_STORE_URL ?? 'http://localhost:3002',
        storageState: '.auth/buyer.json',
      },
      dependencies: ['setup'],
      testMatch: /store\/.*\.spec\.ts/,
    },
  ],
});
```

Tag **`@smoke`** em testes críticos: `test('login admin @smoke', ...)`

---

## data-testid — implementação no código

### React (admin)

```tsx
import { testIds } from '@lojao/test-utils/test-ids';

<input data-testid={testIds.auth.loginEmail} type="email" ... />
<button data-testid={testIds.auth.loginSubmit} type="submit">Entrar</button>
```

### packages/test-utils

```typescript
// packages/test-utils/src/test-ids/auth.ts
export const auth = {
  loginEmail: 'auth-login-email-input',
  loginPassword: 'auth-login-password-input',
  loginSubmit: 'auth-login-submit-btn',
} as const;
```

**Obrigatório:** exportar constantes; **proibido** string solta duplicada em spec e componente.

### Next (storefront)

Mesmo padrão em Client Components. Server wrapper:

```tsx
<section data-testid="store-home-product-grid">...</section>
```

---

## Como o testador escreve specs (padrão)

```typescript
// apps/e2e/tests/admin/login.spec.ts
import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

test('admin login exibe dashboard @smoke', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId(testIds.auth.loginEmail).fill('admin@loja.com');
  await page.getByTestId(testIds.auth.loginPassword).fill('admin123');
  await page.getByTestId(testIds.auth.loginSubmit).click();
  await expect(page.getByTestId('admin-dashboard-stats')).toBeVisible();
});
```

Pré-condição: stack dev up (`make up-full` ou serviços api + admin + db).

---

## Mapa fase → entregáveis de teste

| Fase | Dev implementa | Testador pode |
|------|----------------|---------------|
| **0** | Scaffold `apps/e2e`, `packages/test-utils`, scripts `test:e2e` no root | Instalar Playwright; rodar `pnpm test:e2e` (0 tests ok) |
| **1** | Integração API auth/tenant | Usar API via curl/fixtures; ainda sem E2E UI |
| **2** | testids admin login/dashboard/pedidos + spec smoke admin | Expandir suite admin |
| **3** | testids por módulo admin + 1 spec por módulo crítico | Suite regressão admin |
| **4** | Integração checkout/cart/webhooks; seed `createTestOrder()` | E2E checkout (dados via API seed) |
| **5** | testids vitrine + spec browse | Specs vitrine pública |
| **6** | testids checkout + specs @smoke comprador | Suite completa comprador |
| **7** | Testes migrate/seed db | — |
| **8** | CI `make test-all`; remover Jest do gate principal | Regression full CI |

---

## Comandos (root package.json — evoluir por fase)

```json
{
  "scripts": {
    "test": "turbo test",
    "test:api": "pnpm --filter api test",
    "test:legacy": "pnpm --filter legacy test",
    "test:e2e": "pnpm --filter e2e test",
    "test:e2e:smoke": "pnpm --filter e2e test -- --grep @smoke",
    "test:all": "pnpm test && pnpm test:e2e:smoke"
  }
}
```

Makefile: `make test-e2e`, `make test-e2e-smoke`, `make test-all` — ver [DEPLOY.md](./DEPLOY.md).

---

## Checklist do implementador (toda fase com UI nova)

- [ ] Constantes em `packages/test-utils/src/test-ids/`
- [ ] `data-testid` nos componentes (via constantes)
- [ ] Linha em [test-ids-catalog.md](./test-ids-catalog.md)
- [ ] Spec Playwright mínimo se fase introduz tela (ou estender spec existente)
- [ ] Documentar URL/baseURL e credenciais dev no spec ou README do e2e
- [ ] **Nenhum** `data-testid` adicionado ao EJS legacy

---

## Checklist do testador (após cada fase UI)

- [ ] Clonar constantes ou importar `@lojao/test-utils` nos specs
- [ ] Rodar `pnpm test:e2e:smoke` localmente
- [ ] Registrar casos novos no catálogo test-ids
- [ ] Não usar seletores CSS/texto se existir testid documentado

---

Ver seção equivalente em cada `phases/XX-*.md` para casos de teste **específicos** da fase.
