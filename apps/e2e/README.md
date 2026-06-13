# E2E — Playwright (QA)

Suíte end-to-end do Lojão. Cobre **admin React** (`:5173`) e **storefront Next** (`:3000`). Seletores via `data-testid` de `@lojao/test-utils/test-ids`.

## Estrutura

```
apps/e2e/
  fixtures/
    auth.setup.ts        # login admin → .auth/admin.json
    buyer.setup.ts       # login comprador → .auth/buyer.json
  tests/
    admin/               # specs @smoke dos 12 módulos admin
    store/               # vitrine, auth, carrinho, checkout, pedidos
  playwright.config.ts
```

Projetos:

- **setup** — auth admin
- **admin** — specs admin com storageState
- **buyer-setup** — auth comprador via UI
- **store** — specs storefront (serial, baseURL `:3000`)

## Variáveis de ambiente

```env
E2E_BASE_URL=http://localhost:5173
E2E_STORE_URL=http://localhost:3000
E2E_API_URL=http://localhost:3001
E2E_TENANT_SLUG=loja
E2E_ADMIN_EMAIL=admin@loja.com
E2E_ADMIN_PASSWORD=admin123
```

## Pré-requisitos

1. Stack no ar:

```bash
make up-d
make seed          # recomendado para dados demo
```

2. Chromium Playwright (uma vez):

```bash
pnpm --filter e2e exec playwright install chromium
```

## Comandos

```bash
pnpm --filter e2e test              # suite completa
pnpm --filter e2e test:smoke        # só @smoke
pnpm test:e2e:smoke                 # atalho raiz
pnpm test:all                       # api vitest + smoke E2E
```

## Para o testador QA

- Smoke (`@smoke`): login admin, dashboard, módulos admin, vitrine, carrinho, checkout teste, meus-pedidos.
- Catálogo testids: `docs/migration/test-ids-catalog.md`
- Antes de release: rodar suite completa (`pnpm --filter e2e test`), não só smoke.
- Tag sugerida pós-migração: `v2.0.0-monorepo`
