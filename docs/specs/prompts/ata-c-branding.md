# Prompt — Fase C · Branding admin (`ata-c`)

> Spec: [ata-labs-platform-spec.md § Fase C](../ata-labs-platform-spec.md#fase-c--branding-ata-labs--ata-commerce) · [design-system.md](../design-system.md)

---

## Prompt para o agente

```
Implemente o restante da Fase C — Branding Ata Commerce no admin + defaults API.

## Leitura obrigatória
1. AGENTS.md, .cursor/rules/lojao-migration.mdc
2. docs/specs/STATUS.md — Fase C já in_progress; concluir pendências
3. docs/specs/ata-labs-platform-spec.md § Fase C (checklist ✅/🔲)
4. docs/specs/design-system.md e packages/design-tokens/

## Já feito (não regredir)
- @lojao/design-tokens, storefront marketing tokens, landing/pricing, títulos "Ata Commerce" no admin

## Implementar agora
### Admin visual
- apps/admin/src/index.css — import @lojao/design-tokens/tokens.css + fonte Figtree
- login.tsx, admin/layout.tsx, platform layout — paleta Ata Commerce (azul tokens), não gray genérico
- data-testid admin-login-brand no login
- favicon placeholder Ata Commerce (apps/admin/public ou index.html)

### Grep "Lojão"
- Zero "Lojão" visível em apps/admin/src e apps/storefront/src/app/(marketing) (exceto comentários)

### API / env
- Seed/bootstrap: loja_nome default sem "Lojão" (ex. "Ata Commerce Demo")
- .env.example: EMAIL_FROM="Ata Commerce <noreply@atalabs.com.br>"
- OpenAPI title "Ata Commerce API" (opcional, se existir config)

## Fora de escopo
- Renomear pacotes @lojao/*, cookie lojao.sid, serviços Render lojao-*

## Testes
- pnpm turbo typecheck
- apps/e2e/tests/marketing/site.spec.ts smoke
- Grep manual confirmado

## Ao concluir
- docs/specs/STATUS.md: Fase C → done + log
- Não iniciar Fase H/G/M7 nesta sessão
```
