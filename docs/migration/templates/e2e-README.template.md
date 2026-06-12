# apps/e2e — Testes Playwright

Testes E2E da UI **nova** (admin React + vitrine Next). **Não** testar páginas EJS legacy.

## Pré-requisitos

```bash
make up-d                    # ou make up-full (api + admin + storefront + db)
pnpm exec playwright install chromium
```

## Variáveis

| Variável | Default | Uso |
|----------|---------|-----|
| `E2E_BASE_URL` | `http://localhost:5173` | Admin |
| `E2E_STORE_URL` | `http://localhost:3002` | Storefront |
| `E2E_API_URL` | `http://localhost:3001` | Fixtures HTTP |
| `E2E_TENANT_SLUG` | `loja` | Header tenant |
| `E2E_ADMIN_EMAIL` | `admin@loja.com` | Login admin |
| `E2E_ADMIN_PASSWORD` | `admin123` | Login admin |

## Comandos

```bash
pnpm test:e2e              # todos
pnpm test:e2e:smoke        # tag @smoke
pnpm --filter e2e test -- --ui
```

## Seletores

Usar **somente** `data-testid` via constantes `@lojao/test-utils/test-ids`.

```typescript
import { testIds } from '@lojao/test-utils/test-ids';
await page.getByTestId(testIds.auth.loginSubmit).click();
```

Catálogo: `docs/migration/test-ids-catalog.md`

## Estrutura

```
tests/admin/     # Fase 2+
tests/store/     # Fase 5+
fixtures/        # auth.setup.ts → .auth/*.json
```

## Responsabilidades

| Quem | O quê |
|------|-------|
| Dev (por fase) | Specs smoke mínimos + testids |
| Testador QA | Expandir casos, CI, regressão |

Ver `docs/migration/TESTING-IMPLEMENTATION.md`.
