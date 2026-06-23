# Prompt — M7 · UI signup self-service (`store-m7`)

> Spec: [storefront-onboarding-spec.md](../storefront-onboarding-spec.md) · Protótipos: `atalabs-landing/landing/checkout.html`, `success.html`

**Pré-requisitos:** Fase G (API) + Fase H (login sem slug) + Fase C (visual).

---

## Prompt para o agente

```
Implemente M7 — UI self-service no storefront (/signup/*).

## Leitura obrigatória
1. AGENTS.md, .cursor/rules/lojao-migration.mdc
2. docs/specs/storefront-marketing-STATUS.md — marque M7 in_progress
3. docs/specs/storefront-onboarding-spec.md (rotas, conteúdo, testids)
4. docs/specs/design-system.md — paleta Ata Commerce (azul)
5. atalabs-landing/landing/checkout.html e success.html (referência visual)
6. apps/storefront/src/lib/marketing/plans.ts

## Rotas (App Router)
apps/storefront/src/app/(marketing)/signup/
  page.tsx              → /signup?plan=
  checkout/page.tsx     → /signup/checkout?plan=
  success/page.tsx      → /signup/success

Layout: Ata Commerce azul, header simples (logo + "Voltar aos planos" → /pricing), sem footer verde institucional.

## Checkout — 3 steps
1. Sua loja: nome, slug (check GET /api/v1/public/signup/check-slug), segmento opcional
2. Sua conta: nome, email, senha, confirmar
3. Pagamento: plano + ciclo + trial 14d sem cartão (MVP); sidebar resumo de plans.ts

Submit: POST /api/v1/public/signup → redirect /signup/success?slug=...

## Success
- Hero confirmação, resumo slug/URLs, timeline 3 passos
- CTA "Ir para o painel" → NEXT_PUBLIC_ADMIN_URL/login (sem slug!)
- CTA "Ver minha loja" → /store/{slug}

## Wire CTAs /pricing
Substituir #contato nos botões Contratar:
- cards → /signup/checkout?plan={slug}
- Enterprise → /signup?plan=enterprise ou #contato

## Testes
- testids: signup-page, signup-checkout-page, signup-checkout-slug-input, signup-checkout-submit, signup-success-page, signup-success-admin-link, signup-success-store-link
- docs/migration/test-ids-catalog.md
- apps/e2e/tests/marketing/signup.spec.ts (@smoke)
- pnpm --filter storefront typecheck

## Fora de escopo
- Cobrança real cartão/Pix
- Auto-login one-time token

## Ao concluir
- docs/specs/storefront-marketing-STATUS.md: M7 → done + log
- docs/specs/STATUS.md: nota M7 concluído
```
