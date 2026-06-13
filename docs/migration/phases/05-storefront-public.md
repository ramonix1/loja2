# Fase 5 — Vitrine pública Next.js

| Campo | Valor |
|-------|-------|
| **ID** | `phase-5` |
| **Depende de** | Fase 1 `done` |
| **Duração estimada** | 3–4 semanas |
| **Deploy** | [DEPLOY.md § Fase 5](../DEPLOY.md#fase-5--storefront-next) |

---

## Objetivo

Migrar **vitrine pública** (não autenticada + browse) para Next.js com SSR. Legacy continua servindo login/checkout até Fase 6.

---

## Escopo

### IN

- [x] `apps/storefront/` — Next.js 15 App Router + TypeScript + Tailwind 4
- [ ] Middleware tenant (`middleware.ts`) — mesma lógica de slug
- [ ] Páginas:
  - `/` — home (categorias + produtos)
  - `/produto/[id]` — detalhe
  - `/login`, `/cadastro` — podem ser stub redirect legacy **ou** implementação mínima se sessão compartilhada funcionar cross-origin
- [ ] Layout: header, footer, tema por tenant (cor, logo, nome)
- [ ] API pública:
  - `GET /api/v1/public/store`
  - `GET /api/v1/public/categories`
  - `GET /api/v1/public/products`
  - `GET /api/v1/public/products/:id`
- [ ] SEO: `generateMetadata` por página e por loja
- [ ] Docker service `storefront` + Caddy/proxy roteando `/` → Next
- [ ] Legacy redirect: `/` e `/produto/:id` → Next (proxy ou 302)

### OUT

- Carrinho, checkout, meus-pedidos (Fase 6)
- Auth completa no Next (opcional stub)

---

## Referência legacy

| EJS | Next route |
|-----|------------|
| `index.ejs` | `app/page.tsx` |
| `detail.ejs` | `app/produto/[id]/page.tsx` |
| `partials/header.ejs`, `footer.ejs` | `components/layout/` |
| `partials/produto-card.ejs` | `components/product-card.tsx` |

Portar queries de `produtoController.home` e `produtoController.detail` para endpoints public API.

---

## Tenant no Next

**middleware.ts** resolve slug e injeta header ou cookie para server components fetcharem API:

```typescript
// fetch(`${API_URL}/api/v1/public/products`, {
//   headers: { 'X-Tenant-Slug': slug },
//   next: { revalidate: 60 }
// })
```

Dev: `TENANT_SLUG=loja` fallback igual legacy.

---

## Design

- Reutilizar tokens de cor de `res.locals.loja.cor_primaria`
- Imagens: URLs existentes em `/uploads` — proxy static ou servir via legacy até unificar CDN
- Responsivo mobile-first

---

## Critérios de aceite (DoD)

- [ ] Home Next renderiza produtos reais (SSR — view source contém HTML produto)
- [ ] Detalhe produto funciona
- [ ] Tema por tenant (cor + logo) aplicado
- [ ] `curl localhost:3002` ou via proxy `:8080/` retorna 200
- [ ] Legacy home desligada ou redirect
- [ ] **`data-testid`:** `store-home-product-grid`, `store-home-product-card-{id}`, `store-product-detail`, `store-product-add-cart-btn`
- [ ] Catálogo test-ids atualizado (seção store)
- [ ] Lighthouse SEO básico ok (title, meta description por loja)
- [ ] STATUS.md: Fase 5 → `done`

---

## Testes automatizados — como implementar

### Escopo

| Tipo | Ação |
|------|------|
| data-testid | **Obrigatório** — home + detalhe produto (lista abaixo) |
| Playwright | **`apps/e2e/tests/store/vitrine.spec.ts`** |
| Legacy EJS vitrine | **Não** testid; redirect quando Next ativo |

### testids obrigatórios

| testid | Onde |
|--------|------|
| `store-header` | Layout header |
| `store-home-product-grid` | Grade produtos home |
| `store-home-product-card-{id}` | Card (id dinâmico) |
| `store-product-detail` | Página detalhe |
| `store-product-title` | Nome produto |
| `store-product-price` | Preço |
| `store-product-add-cart-btn` | Adicionar ao carrinho (pode desabilitar até Fase 6) |

Constantes: `packages/test-utils/src/test-ids/store.ts`

### Spec Playwright (implementar)

**`apps/e2e/tests/store/vitrine.spec.ts`**

```typescript
test('home exibe produtos @smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('store-home-product-grid')).toBeVisible();
});

test('detalhe produto @smoke', async ({ page }) => {
  await page.goto('/produto/1');  // id seed documentado
  await expect(page.getByTestId('store-product-detail')).toBeVisible();
});
```

Usar `E2E_STORE_URL=http://localhost:3002` no project `store` do Playwright.

### Testes API (dev back)

```
apps/api/tests/integration/public.products.test.ts
apps/api/tests/integration/public.store.test.ts
```

### Pronto para o testador

- Browse público automatizado sem login
- Adicionar SEO/a11y checks opcionais
- Aguardar Fase 6 para cart/checkout E2E

---

## Verificação

```bash
pnpm --filter storefront dev
curl -s http://localhost:3002/ | grep -i produto
curl -s http://localhost:3002/produto/1 | grep -i "<title>"
```

---

## Handoff Fase 6

- Componentes reutilizáveis para carrinho/checkout
- Decisão auth: sessão cookie cross-app documentada
- Static uploads path unificado
