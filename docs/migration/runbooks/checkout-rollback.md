# Rollback — checkout API

Se checkout na API (Fase 4) falhar em produção.

## Sintomas

- Pedidos não criados
- Webhooks não processados
- Pagamentos duplicados ou perdidos

## Procedimento

1. Definir env:
   ```env
   USE_NEW_CHECKOUT=false
   USE_NEW_WEBHOOKS=false
   USE_NEW_CART=false
   ```
2. Reiniciar serviços: `docker compose restart api legacy`
3. Reconfigurar URL webhook no Stripe/SumUp para endpoint legacy (porta/host anterior)
4. Verificar smoke test legacy checkout
5. Investigar logs api: `make logs-api`

## Após correção

1. Testar em staging com flags `true`
2. Reativar flags gradualmente (webhooks primeiro, depois checkout)

## Prevenção

- Sempre testar método `teste` antes de ativar flags em produção
- Manter idempotência em webhooks
