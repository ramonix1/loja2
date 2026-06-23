# Specs — Ata Labs / Ata Commerce

> **Fonte de verdade (Obsidian):** `Ata Tech/Ata Commerce/loja2/specs/` no vault OneDrive.  
> Arquivos `*.md` abaixo (exceto `STATUS.md` e `prompts/`) são **symlinks locais** — rodar `./scripts/setup-obsidian-vault.sh` após clone.

Especificações **spec-driven** pós-migração (Fase 8 concluída). Complementam `docs/migration/` — não substituem.

## Leitura obrigatória (nesta ordem)

1. [design-system.md](./design-system.md) — tokens Ata Labs / Ata Commerce (PDF + protótipos)
2. [ata-labs-platform-spec.md](./ata-labs-platform-spec.md) — spec mestre + fases A–H (infra, tenant, platform, self-service)
3. [storefront-marketing-spec.md](./storefront-marketing-spec.md) — landing, planos, demo, `/store/[slug]`, **M7 checkout** (**UI storefront**)
4. [STATUS.md](./STATUS.md) — progresso platform A–H
5. [storefront-marketing-STATUS.md](./storefront-marketing-STATUS.md) — progresso M1–M7
6. [storefront-onboarding-spec.md](./storefront-onboarding-spec.md) — self-service (Fase G + M7)
7. [admin-merchant-hub-spec.md](./admin-merchant-hub-spec.md) — login sem slug (Fase H)
8. [shadcn-ui-migration-spec.md](./shadcn-ui-migration-spec.md) — shadcn/ui em `@lojao/ui` · [STATUS](./shadcn-ui-migration-STATUS.md)
9. [prompts/README.md](./prompts/README.md) — **prompts copy-paste por fase**
10. [../migration/TESTING-STRATEGY.md](../migration/TESTING-STRATEGY.md) — testids e Playwright
11. [../migration/TESTING-IMPLEMENTATION.md](../migration/TESTING-IMPLEMENTATION.md) — como implementar testes
12. [../migration/runbooks/render-blueprint.md](../migration/runbooks/render-blueprint.md) — deploy Render

## Regra de ouro

**Uma fase por sessão**, salvo instrução explícita. Não avançar para fase N+1 até DoD verificado e `STATUS.md` atualizado.

## Fases

| Fase | ID | Objetivo |
|------|-----|----------|
| A | `ata-a` | DNS Cloudflare + env Render + CORS + R2 CDN |
| B | `ata-b` | Migração URLs de imagens no Postgres + performance |
| C | `ata-c` | Branding Ata Labs / Ata Commerce (UI) |
| D | `ata-d` | Vitrine `/store/[slug]` + `packages/tenant-host` |
| E | `ata-e` | Login admin com identificação de tenant |
| F | `ata-f` | Platform Hub `/platform` + API tenants |
| G | `ata-g` | Onboarding self-service (API signup + trial) |
| H | `ata-h` | Merchant Hub — login sem slug, `/admin/my-stores` |

## shadcn/ui (sub-initiative)

Spec: [shadcn-ui-migration-spec.md](./shadcn-ui-migration-spec.md) · Status: [shadcn-ui-migration-STATUS.md](./shadcn-ui-migration-STATUS.md)

| Fase | ID | Objetivo |
|------|-----|----------|
| S0 | `shadcn-s0` | Init shadcn + bridge tokens em `packages/ui` |
| S1 | `shadcn-s1` | Button, Card, Switch (facades) |
| S2 | `shadcn-s2` | Table, Badge, Skeleton, ChartCard |
| S3 | `shadcn-s3` | Dialog, Select, forms admin |
| S4 | `shadcn-s4` | Sheet mobile + ScrollArea |
| S5 | `shadcn-s5` | Storefront checkout/auth |
| S6 | `shadcn-s6` | Limpeza + docs + CI |

## Storefront marketing (sub-initiative)

Spec dedicada: [storefront-marketing-spec.md](./storefront-marketing-spec.md) · Status: [storefront-marketing-STATUS.md](./storefront-marketing-STATUS.md)

Onboarding UI: [storefront-onboarding-spec.md](./storefront-onboarding-spec.md) (M7 + Fase G)

| Fase | ID | Objetivo |
|------|-----|----------|
| M1 | `store-m1` | Design system Ata Labs + layouts |
| M2 | `store-m2` | Landing `/` (port protótipo HTML) |
| M3 | `store-m3` | Página produto `/ata-commerce` |
| M4 | `store-m4` | Planos `/pricing` (preços placeholder) |
| M5 | `store-m5` | Demo `/demo` |
| M6 | `store-m6` | Vitrine `/store/[slug]` + redirects |
| M7 | `store-m7` | Checkout self-service `/signup/*` (protótipo checkout/success) |

## Ordem recomendada pós-F

1. **H** — Merchant Hub (UX login imediata)
2. **C** — Fechar branding admin
3. **G** — API signup + provisionamento público
4. **M7** — UI contratação + CTAs `/pricing` → `/signup`
