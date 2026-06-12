# Fase 4 — API crítica: checkout, webhooks, billing, chat

| Campo | Valor |
|-------|-------|
| **ID** | `phase-4` |
| **Depende de** | Fase 1 `done` (pode overlap com Fase 3 após semana 12) |
| **Duração estimada** | 4–5 semanas |
| **Deploy** | [DEPLOY.md § Fase 4](../DEPLOY.md#fase-4--api-crítica) |

---

## Objetivo

Migrar **toda lógica crítica de negócio** para Fastify: carrinho, frete, checkout, webhooks, billing, Socket.io. Legacy desliga essas rotas com feature flag.

---

## Escopo

### IN

Portar de `apps/legacy/` para `apps/api/src/modules/`:

| Módulo | Legacy source | Endpoints |
|--------|---------------|-----------|
| Carrinho | `carrinhoController.js`, `carrinhoRoutes.js` | `/api/v1/cart/*` |
| Frete | `freteService.js`, `freteRoutes.js` | `POST /api/v1/shipping/calculate` |
| Checkout | `checkoutController.js` | `GET/POST /api/v1/checkout/*` |
| Webhooks | checkout webhooks | `POST /webhook/stripe`, `POST /webhook/sumup` |
| Billing | `billingService.js`, `billingRoutes.js` | `/api/v1/billing/*`, `/api/v1/admin/billing/*` |
| Chat | `chatController.js`, `config/socketio.js` | REST + Socket.io no Fastify |

Serviços a portar (TS):
- `services/stripeService.js`
- `services/mercadoPagoService.js`
- `services/sumupService.js`
- `services/freteService.js`
- `services/billingService.js`
- `services/emailService.js`

### Feature flags (env)

```env
USE_NEW_CHECKOUT=false          # true quando validado
USE_NEW_CART=false
USE_NEW_WEBHOOKS=false
USE_NEW_CHAT=false
```

Legacy consulta flags e proxy/redireciona para API quando `true`.

### OUT

- UI checkout Next (Fase 6)
- Drizzle (Fase 7)
- Mudanças de schema

---

## Requisitos críticos

### Webhooks

- **Sem CSRF**
- Raw body para assinatura Stripe/SumUp
- Idempotência: não processar mesmo evento 2x
- Log estruturado de eventos

### Checkout

- Mesmos métodos: pix, boleto, cartao (Stripe), sumup_online, teste
- Comissão billing: `BillingService.recordCommissionOnOrder` após status `pago`
- E-mails transacionais preservados

### Carrinho

- Sessão ou DB — manter mesmo comportamento legacy (verificar se carrinho é session ou tabela)

### Socket.io

- `@fastify/socket.io` ou socket.io anexo ao server HTTP Fastify
- Mesmos eventos que `config/socketio.js`
- Bot respostas preservado

---

## Contratos principais

### POST /api/v1/shipping/calculate

Auth required. Body: CEP destino, itens/peso. Response: opções PAC/SEDEX.

### POST /api/v1/checkout

Auth required. Body: endereço, método pagamento, dados cartão (stripe PM id). Response: `{ data: { pedido_id, status, redirect_url? } }`

### Webhooks

Manter paths **idênticos** ao legacy para não reconfigurar gateways em dev:
- `/webhook/stripe`
- `/webhook/sumup`

---

## Testes automatizados — como implementar

> **Sem UI nova nesta fase** — apenas API. Legacy EJS checkout **não** recebe testid.

### Escopo

| Tipo | Ação |
|------|------|
| Integração API | **Obrigatório** — ver tabela abaixo |
| E2E Playwright checkout | **Preparar fixtures apenas** — specs completos na Fase 6 |
| data-testid | **Não** — checkout UI ainda EJS/legacy até Fase 6 |

### Estrutura de testes API

```
apps/api/tests/
  integration/
    cart.add.test.ts
    cart.update.test.ts
    shipping.calculate.test.ts
    checkout.teste.test.ts
    checkout.stripe.test.ts          # mock stripe
    webhook.stripe.test.ts
    webhook.sumup.test.ts
    billing.commission.test.ts
  fixtures/
    stripe-event.json
    sumup-event.json
  helpers/
    seed-order.ts
```

### Casos obrigatórios (implementar)

| Área | Caso | Assert principal |
|------|------|------------------|
| Cart | POST add item autenticado | 200, item no cart |
| Cart | POST add sem auth | 401 |
| Shipping | POST calcular CEP válido | 200, opções frete |
| Checkout | POST método `teste` | pedido `pago`, id retornado |
| Checkout | POST estoque insuficiente | 409 |
| Webhook Stripe | POST evento `checkout.session.completed` fixture | pedido atualizado, idempotente |
| Webhook Stripe | Repetir mesmo event_id | 200 sem duplicar |
| Billing | Após checkout pago | linha em `commission_transactions` |
| Chat | POST mensagem + bot keyword | resposta bot inserida |

### Fixture para testador (Fase 6)

Implementar em `packages/test-utils/src/fixtures/`:

```typescript
/** Cria pedido via API (método teste) — usado por Playwright Fase 6 */
export async function seedPedidoTeste(opts: {
  apiUrl: string;
  sessionCookie: string;
  tenantSlug: string;
}): Promise<{ pedidoId: number }>;
```

### Comandos

```bash
pnpm --filter api test
pnpm --filter api test -- checkout   # subset
```

Coverage checkout/billing ≥ 60% (vitest coverage).

### Pronto para o testador

- Checkout automatizável **via API** sem UI
- Fixtures documentadas em `packages/test-utils/src/fixtures/README.md`
- E2E checkout UI aguarda Fase 6 (Next + testids)

---

## Testes obrigatórios (resumo DoD)

- [ ] Unit: cálculo frete (mock Melhor Envio)
- [ ] Integration: criar pedido método `teste`
- [ ] Integration: webhook stripe (payload fixture)
- [ ] Integration: login → add cart → checkout teste → pedido pago
- [ ] Billing: comissão registrada após pagamento
- [ ] Chat: enviar mensagem, bot responde

Meta coverage módulos checkout/billing: **≥ 60%**

---

## Deploy

- Copiar **todas** env vars de pagamento do legacy para serviço `api` no compose
- Documentar URL webhook dev (ngrok) em `LEIA-ME.md`
- Quando `USE_NEW_WEBHOOKS=true`, apontar Stripe dashboard para `:3001`

---

## Critérios de aceite (DoD)

- [ ] Pedido fim-a-fim via API (método `teste`) em staging/dev
- [ ] Webhook stripe processado (modo teste)
- [ ] Legacy checkout desligado com flag `USE_NEW_CHECKOUT=true`
- [ ] Admin React (Fase 3) atualiza status pedido via API
- [ ] Chat funciona via API socket
- [ ] Nenhuma regressão em billing invoices
- [ ] STATUS.md: Fase 4 → `done`

---

## Rollback

Se falhar em produção:
1. `USE_NEW_*=false` no env
2. Reiniciar legacy + api
3. Webhooks voltam para legacy

Documentar procedimento em `docs/migration/runbooks/checkout-rollback.md`

---

## Handoff Fase 6

- Contratos checkout documentados para Next storefront
- Stripe public key exposta via `GET /api/v1/public/payment-config`
