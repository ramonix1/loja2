# E2E — Playwright (QA)

Suíte end-to-end do Lojão. A partir da **Fase 2**, cobre o admin React; vitrine (Next) entra nas Fases 5–6. **Nunca** aponta specs para o EJS legacy.

Seletores usam **`data-testid`** via constantes de `@lojao/test-utils/test-ids` (nunca strings literais ou CSS/texto).

## Estrutura

```
apps/e2e/
  fixtures/
    auth.setup.ts        # login admin via UI → salva .auth/admin.json
  tests/
    admin/
      login.spec.ts      # login ok (@smoke) + credencial inválida
      pedidos.spec.ts    # lista pedidos (@smoke) + sidebar
  playwright.config.ts
```

Projetos do Playwright:

- **setup** — roda `fixtures/auth.setup.ts`, gera o storageState autenticado.
- **admin** — specs `tests/admin/*.spec.ts`, reaproveita `.auth/admin.json` (baseURL `:5173`). `login.spec.ts` sobrescreve o storageState para começar deslogado.
- **store** — reservado para a vitrine (Fases 5–6).

## Variáveis de ambiente

```env
E2E_BASE_URL=http://localhost:5173      # admin (Vite)
E2E_API_URL=http://localhost:3001       # Fastify
E2E_TENANT_SLUG=loja
E2E_ADMIN_EMAIL=admin@loja.com
E2E_ADMIN_PASSWORD=admin123
```

Defaults já apontam para o ambiente dev local; só exporte se precisar sobrescrever.

## Pré-requisitos

1. Stack no ar (admin + api + db):

```bash
make up-d                  # legacy + api + db
pnpm --filter admin dev    # admin em :5173 (ou via Docker: make up-full)
```

2. Navegador do Playwright instalado (uma vez):

```bash
pnpm --filter e2e exec playwright install chromium
```

## Comandos

```bash
# todos os specs
pnpm --filter e2e test

# só os smoke (login + pedidos)
pnpm --filter e2e test:smoke
pnpm test:e2e:smoke        # atalho a partir da raiz

# modo UI (debug)
pnpm --filter e2e test:ui
```

## Para o testador QA

- Specs smoke (`@smoke`) cobrem login → dashboard e listagem de pedidos.
- Para novos casos (filtros, paginação, status), use os testids já existentes em `@lojao/test-utils/test-ids` (`testIds.admin.*`, `testIds.auth.*`) — ver catálogo em `docs/migration/test-ids-catalog.md`.
- Não adicione `data-testid` no EJS legacy.
