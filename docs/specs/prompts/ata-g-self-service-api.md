# Prompt — Fase G · API self-service (`ata-g`)

> Spec: [storefront-onboarding-spec.md §6](../storefront-onboarding-spec.md#6-api--fase-g-platform) · Reutiliza provisionamento Fase F

**Pré-requisito recomendado:** Fase H done (login sem slug).

---

## Prompt para o agente

```
Implemente a Fase G — API pública de onboarding self-service.

## Leitura obrigatória
1. AGENTS.md, .cursor/rules/lojao-migration.mdc, docs/api-dependency-inversion.md
2. docs/specs/STATUS.md — marque Fase G in_progress
3. docs/specs/storefront-onboarding-spec.md §6 (API) e §7 (billing/trial)
4. apps/api/src/modules/platform/* (provisionamento Fase F)
5. apps/api/src/modules/billing/* e BILLING_INTEGRATION.md (trial)
6. packages/types/

## Endpoints (sem tenant, sem auth lojista)
Prefixo: /api/v1/public/signup

| Método | Rota | Função |
|--------|------|--------|
| GET | /public/signup/check-slug?slug= | slug disponível (master tenants) |
| POST | /public/signup/preview | valida Zod, não persiste |
| POST | /public/signup | cria tenant + admin + trial 14d |
| GET | /public/signup/plans | mirror planos marketing |

## Body POST /public/signup
planSlug: starter|professional|enterprise
billingCycle: monthly|annual
trial: boolean (default true MVP)
loja: { nome, slug }
admin: { nome, email, senha }
payment?: opcional — OUT no MVP (trial sem cartão)

## Fluxo provisionamento
1. Validar slug único + regex [a-z0-9-] + slugs reservados (demo, admin, api…)
2. Reutilizar runMigrations / platform.service (mesmo Fase F)
3. Criar usuarios role admin no tenant
4. Seed config mínima (loja_nome, aparência Ata Commerce)
5. tenant_billing + trialEndsAt (+14d) — stub cobrança real (log ok MVP)
6. Idempotency-Key header ou hash email+slug

## Resposta sucesso
{ data: { tenantSlug, lojaNome, adminEmail, storefrontUrl, adminUrl, trialEndsAt? } }

## Segurança
- Rate limit por IP (básico)
- Sem expor stack trace
- Enterprise: rejeitar ou retornar code ENTERPRISE_CONTACT (sem auto-provision)

## Testes
- vitest: check-slug, validation, signup happy path, slug duplicado, idempotência
- Não quebrar testes platform existentes (135+)

## Fora de escopo (MVP G)
- Gateway Stripe/Asaas produção
- Auto-login token pós-signup
- UI storefront /signup/* (isso é M7)

## Verificação
pnpm --filter api test
pnpm turbo typecheck

## Ao concluir
- docs/specs/STATUS.md: Fase G → done + log
- Não implementar M7 UI nesta sessão
```
