# Prompt — Fase H · Merchant Hub (`ata-h`)

> Spec: [admin-merchant-hub-spec.md](../admin-merchant-hub-spec.md)

---

## Prompt para o agente

```
Implemente a Fase H — Merchant Hub (login admin sem slug).

## Leitura obrigatória (nesta ordem)
1. AGENTS.md e .cursor/rules/lojao-migration.mdc
2. docs/specs/STATUS.md — marque Fase H como in_progress
3. docs/specs/admin-merchant-hub-spec.md (spec completa)
4. apps/api/src/lib/resolve-login-tenant.ts (já faz scan cross-tenant)
5. apps/api/src/modules/auth/* e apps/admin/src/routes/login.tsx

## Objetivo
Lojista faz login só com e-mail + senha. Sem campo slug.
- 1 loja → /admin/dashboard direto
- 2+ lojas → /admin/my-stores (hub "Minhas lojas")
- Sidebar: "Trocar loja" → /admin/my-stores
- platform_admin inalterado (/platform/login)

## API (prefixo /api/v1)
- POST /auth/login — sem tenantSlug: retorna step ready | select_tenant | erro NO_TENANT_ACCESS
- POST /auth/select-tenant — body { tenantSlug }; valida acesso admin; seta session.tenantSlug
- GET /auth/my-stores — lista lojas do admin autenticado
- Guards admin: sem tenantSlug → 403 TENANT_NOT_SELECTED (exceto rotas acima + hub UI)

## Admin UI
- Remover campo slug de apps/admin/src/routes/login.tsx
- Nova rota /admin/my-stores — cards com lojaNome, slug secundário, botão Entrar
- RootRedirect / pós-login: respeitar step da API
- LayoutAdmin: link "Trocar loja" → /admin/my-stores

## Testes
- vitest: login mono/multi/0 lojas, select-tenant, my-stores, 403 sem tenant
- E2E: apps/e2e/tests/admin/merchant-hub.spec.ts (login sem slug, hub, trocar loja)
- testids: merchant-hub-page, merchant-hub-store-card-{slug}, merchant-hub-select-{slug}
- Atualizar docs/migration/test-ids-catalog.md
- Deprecar admin-login-slug-input (alias temporário ok)

## Fora de escopo
- SSO, convite co-admin, subdomínio por tenant

## Verificação
pnpm --filter api test
pnpm --filter admin typecheck
pnpm --filter e2e test (smoke admin)

## Ao concluir
- docs/specs/STATUS.md: Fase H → done + log de entrega
- Não implementar G ou M7 nesta sessão
```
