# Smoke test — fluxo comprador

Executar após Fase 6 ou antes de Fase 8.

## Pré-requisitos

- `make up-d` com storefront + api + db
- Tenant `loja` provisionado
- Admin: admin@loja.com / admin123
- Produto cadastrado com estoque

## Passos

1. [ ] Abrir vitrine `/` — produtos visíveis
2. [ ] Abrir `/produto/1` — detalhe ok
3. [ ] Cadastrar novo comprador ou usar existente
4. [ ] Login em `/login`
5. [ ] Adicionar produto ao carrinho
6. [ ] `/carrinho` — item listado
7. [ ] `/checkout` — calcular frete (se CEP configurado)
8. [ ] Finalizar com método **teste**
9. [ ] `/checkout/resultado/:id` — status confirmado
10. [ ] `/meus-pedidos` — pedido aparece
11. [ ] Admin React `/admin/pedidos` — mesmo pedido visível

## Falha

Registrar em STATUS.md como bloqueio. Não avançar Fase 8.
