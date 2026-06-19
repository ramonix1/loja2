# Specs — Ata Labs / Ata Commerce

Especificações **spec-driven** pós-migração (Fase 8 concluída). Complementam `docs/migration/` — não substituem.

## Leitura obrigatória (nesta ordem)

1. [ata-labs-platform-spec.md](./ata-labs-platform-spec.md) — spec mestre + fases A–F
2. [STATUS.md](./STATUS.md) — fase ativa e progresso (**atualizar a cada entrega**)
3. [../migration/TESTING-STRATEGY.md](../migration/TESTING-STRATEGY.md) — testids e Playwright
4. [../migration/TESTING-IMPLEMENTATION.md](../migration/TESTING-IMPLEMENTATION.md) — como implementar testes
5. [../migration/runbooks/render-blueprint.md](../migration/runbooks/render-blueprint.md) — deploy Render

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
