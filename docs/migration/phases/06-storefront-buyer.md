# Fase 6 — Área do comprador no Next.js

| Campo | Valor |
|-------|-------|
| **ID** | `phase-6` |
| **Depende de** | Fase 4 + Fase 5 `done` |
| **Duração estimada** | 4–5 semanas |
| **Deploy** | [DEPLOY.md § Fase 6](../DEPLOY.md#fase-6--comprador-next) |

---

## Objetivo

Migrar **fluxo completo do comprador** para Next.js: auth, carrinho, checkout, pós-compra, billing cliente. Desligar vitrine/checkout legacy.

---

## Escopo

### IN

Páginas Next:

| Rota | EJS legacy | Auth |
|------|------------|------|
| `/login` | login.ejs | guest |
| `/cadastro` | cadastro.ejs | guest |
| `/recuperar-senha` | recuperar-senha.ejs | guest |
| `/redefinir-senha/[token]` | redefinir-senha.ejs | guest |
| `/carrinho` | carrinho.ejs | required |
| `/checkout` | checkout.ejs | required |
| `/checkout/resultado/[id]` | checkout-resultado.ejs | required |
| `/meus-pedidos` | meus-pedidos.ejs | required |
| `/dashboard/billing` | cliente-billing.ejs | required |

Integrações front:
- [ ] Stripe.js Elements (port de `checkout.ejs`)
- [ ] SumUp redirect flow
- [ ] ViaCEP para endereço
- [ ] Consumir API Fase 4 (`/cart`, `/checkout`, `/shipping`)
- [ ] **`data-testid`** em todo fluxo comprador (login, carrinho, checkout, pedidos) — ver TESTING-STRATEGY

### data-testid mínimos (Fase 6)

| testid | Elemento |
|--------|----------|
| `store-cart-table` | Itens carrinho |
| `store-cart-checkout-btn` | Ir para checkout |
| `store-checkout-submit-btn` | Finalizar |
| `store-checkout-payment-{metodo}` | Opção pagamento |
| `store-orders-table` | Meus pedidos |
| `store-order-row-{id}` | Linha pedido |

Auth:
- [ ] Login/cadastro via API Fase 1 com cookie compartilhado
- [ ] Middleware Next protege rotas autenticadas
- [ ] Logout limpa sessão API + redirect

### OUT

- Remover legacy EJS comprador
- Playwright e2e (opcional mas recomendado)

---

## Checkout UI

Portar lógica JS de `views/pages/checkout.ejs`:
- Seleção método pagamento
- Painéis pix/boleto/cartão/sumup
- Stripe `createPaymentMethod` → `POST /api/v1/checkout`

**Crítico:** testar todos métodos habilitados na config da loja.

---

## Testes automatizados — como implementar

### Escopo

| Tipo | Ação |
|------|------|
| data-testid | **Obrigatório** — fluxo comprador completo |
| Playwright E2E | **Obrigatório** — suite store @smoke |
| Legacy EJS | **Não** testid; páginas removidas/redirect |

### testids obrigatórios (complementar Fase 5)

| testid | Página |
|--------|--------|
| `auth-login-email-input` | /login (store) |
| `auth-login-password-input` | /login |
| `auth-login-submit-btn` | /login |
| `store-cart-table` | /carrinho |
| `store-cart-item-row-{id}` | /carrinho |
| `store-cart-checkout-btn` | /carrinho |
| `store-checkout-form` | /checkout |
| `store-checkout-payment-teste` | /checkout opção teste |
| `store-checkout-submit-btn` | /checkout |
| `store-checkout-success-msg` | /checkout/resultado |
| `store-orders-table` | /meus-pedidos |
| `store-order-row-{id}` | /meus-pedidos |

Reutilizar constantes de `@lojao/test-utils`; registrar no catálogo.

### Specs Playwright (implementar — testador mantém)

| Arquivo | Cenários mínimos |
|---------|------------------|
| `store/auth.spec.ts` | login comprador @smoke; logout |
| `store/cart.spec.ts` | add via UI → cart table visible |
| `store/checkout.spec.ts` | checkout teste end-to-end @smoke |
| `store/orders.spec.ts` | pedido aparece em meus-pedidos @smoke |

**`apps/e2e/fixtures/auth.setup.ts`** — adicionar project comprador:

```typescript
// login comprador teste — criar user seed ou usar cadastro API
// salvar .auth/buyer.json
```

### Fluxo spec checkout @smoke (referência)

```typescript
test('checkout metodo teste @smoke', async ({ page }) => {
  await page.goto('/produto/1');
  await page.getByTestId('store-product-add-cart-btn').click();
  await page.goto('/carrinho');
  await page.getByTestId('store-cart-checkout-btn').click();
  await page.getByTestId('store-checkout-payment-teste').check();
  await page.getByTestId('store-checkout-submit-btn').click();
  await expect(page.getByTestId('store-checkout-success-msg')).toBeVisible();
});
```

Pré-condição: produto id `1` com estoque; usuário comprador autenticado; API checkout Fase 4 ativa.

### Comandos

```bash
make up-full
pnpm test:e2e:smoke
make test-e2e
```

CI: incluir `pnpm test:e2e:smoke` no pipeline (documentar Fase 8).

### Pronto para o testador

- Suite store completa e documentada em `apps/e2e/README.md`
- Pode adicionar Stripe test mode, recuperar senha, billing cliente
- **Não** automatizar EJS legacy

---

## E2E (obrigatório Fase 6)

Playwright — liderança **testador QA**, devs fornecem testids e seed.

`apps/storefront/e2e/` ou `apps/e2e/`:

1. `auth.spec.ts` — login comprador
2. `checkout.spec.ts` — add cart → checkout teste → resultado
3. `orders.spec.ts` — meus pedidos lista pedido criado

Ver [smoke-comprador.md](../runbooks/smoke-comprador.md) e [TESTING-STRATEGY.md](../TESTING-STRATEGY.md).

---

## Critérios de aceite (DoD)

- [ ] Comprador completa compra método `teste` via Next
- [ ] Stripe test mode funciona (se configurado)
- [ ] Carrinho persiste entre reload (mesmo comportamento legacy)
- [ ] Meus pedidos lista pedidos do usuário
- [ ] Recuperação senha envia email (ou mock dev)
- [ ] Zero páginas EJS comprador restantes
- [ ] Catálogo test-ids seção store completo
- [ ] **Playwright E2E smoke passa no CI** (`make test-e2e`)
- [ ] Legacy rotas comprador redirect ou 410
- [ ] STATUS.md: Fase 6 → `done`; métricas EJS vitrine/comprador = 0

---

## Verificação

```bash
pnpm --filter storefront exec playwright test   # se configurado
# Teste manual completo documentado em docs/migration/runbooks/smoke-comprador.md
```

---

## Handoff Fase 8

- Lista EJS restantes (deve ser só error/tenant-management ou zero)
- Uploads/static unificado
