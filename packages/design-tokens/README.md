# @lojao/design-tokens

Tokens CSS da identidade visual **Ata Labs** (verde) e **Ata Commerce** (azul).

**Fonte de verdade:** manual `docs/design/AtaLabs - Identidade Visual new.pdf`. Resumo tabular em `docs/specs/design-system.md` §11.

## Camadas

| Nível | Arquivo | Conteúdo |
|-------|---------|----------|
| 1 — Primitivos | `primitives.css` | `--ata-*` (ata-labs + ata-commerce) |
| 2 — Semânticos | `semantic-admin.css` | `--admin-*` (toggle escuro/claro painel) |
| | `semantic-platform.css` | `--platform-*` (Platform Hub verde/creme) |
| | `semantic-store.css` | `--store-*` (vitrine; sem toggle visitante) |
| 3 — Componentes | `components.css` | Classes `.ds-*` |
| Entrypoints | `admin-ui-theme.css`, `store-ui-theme.css` | Re-export dos semânticos (compat imports) |

## Entrypoints por app

| App | Imports recomendados |
|-----|---------------------|
| Admin | `tokens.css` + `admin-ui-theme.css` + `components.css` |
| Platform Hub | `tokens.css` + `platform-ui-theme.css` + `components.css` |
| Storefront vitrine | `primitives.css` + `store-ui-theme.css` + `components.css` |
| Marketing | `ata-labs.css` ou `ata-commerce.css` conforme rota |

**Build (pnpm):** `@import '@lojao/design-tokens/…'` — resolve via `package.json` exports.

**IDE:** caminhos relativos em `globals.css` / `index.css` para Ctrl+click.

## Governança

```bash
make check-design          # baseline — falha se regressão
STRICT=1 make check-design # CI — zero legado (gate Fase 7)
```

CI: job `test` executa `STRICT=1 make check-design` após typecheck.

## Regra

Novas cores de UI devem usar `--ata-*` ou variáveis semânticas (`--admin-*`, `--platform-*`, `--store-*`) — **não** `gray-*`, `blue-*` ou hex avulsos fora do manual.
