# Fixtures de teste — credenciais dev

Dados de apoio para testes locais e E2E (QA). **Nunca** usar estas credenciais em produção.

## Tenant de desenvolvimento

| Campo | Valor |
|-------|-------|
| `TENANT_SLUG` | `loja` |
| Provisionamento | Automático no boot do legacy (`config/init-db.js`) quando `TENANT_SLUG` + `DATABASE_URL` estão definidos |

## Usuário admin (loja)

| Campo | Valor |
|-------|-------|
| Email | `admin@loja.com` |
| Senha | `admin123` |
| Role | `admin` |

## Usuário comprador (checkout)

| Campo | Valor |
|-------|-------|
| Email | `comprador-test@loja.com` |
| Senha | `comprador123` |
| Role | `usuario` |

## URLs dev

| App | URL |
|-----|-----|
| Legacy (Express + EJS) | http://localhost:3000 |
| API (Fastify) | http://localhost:3001 |
| API health | http://localhost:3001/health |

## Checkout via API (Fase 4+)

Helpers em `@lojao/test-utils`:

```typescript
import { loginComprador, seedPedidoTeste } from '@lojao/test-utils';

const cookie = await loginComprador('http://localhost:3001');
const { pedidoId } = await seedPedidoTeste({
  apiUrl: 'http://localhost:3001',
  sessionCookie: cookie,
  tenantSlug: 'loja',
  produtoId: 1, // opcional — default E2E_PRODUCT_ID ou 1
});
```

Pré-requisito: `make up` (db + api), seed de teste com produto checkout.

## Webhooks dev

Com `USE_NEW_WEBHOOKS=true`, apontar Stripe/SumUp para `http://localhost:3001/webhook/*` (use ngrok em staging).
