# Runbook — migrations Drizzle

## Criar nova migration

1. Alterar schema em `packages/db/src/schema/`
2. `pnpm --filter @lojao/db db:generate`
3. Revisar SQL gerado em `packages/db/drizzle/`
4. `pnpm --filter @lojao/db db:migrate` em dev
5. Testar api + smoke relevante
6. Commit migration SQL + schema juntos

## Baseline (Fase 7 inicial)

1. Banco dev populado via legacy boot
2. `drizzle-kit introspect` ou pull
3. Ajustar relations manualmente
4. Marcar baseline como applied sem executar DROP

## Produção

- **Nunca** `db:push` em produção
- Rodar `db:migrate` como step de deploy antes de subir api
- Backup Postgres antes de migration destrutiva

## Multi-tenant

Migrations tenant schema aplicam em **cada** database de tenant ou schema único — seguir decisão documentada em Fase 7 spec.
