# @lojao/ui

Componentes React compartilhados (admin + storefront). shadcn/ui via facades — ver [shadcn-ui-migration-spec.md](../../docs/specs/shadcn-ui-migration-spec.md) (S0–S6 concluída).

## Estrutura

| Caminho | Uso |
|---------|-----|
| `src/*.tsx` | Facades de produto (`Button`, `Card`, `FieldInput`, …) — **API estável** |
| `src/components/ui/*` | Primitivos shadcn (gerados via CLI) |
| `src/lib/utils.ts` | `cn()` — clsx + tailwind-merge |
| `src/styles/shadcn.css` | `@theme inline` + `border-border` global (Tailwind 4) |
| `components.json` | Configuração do CLI shadcn (`new-york-v4`) |

## Superfícies (`surface`)

| Valor | Contexto |
|-------|----------|
| `admin` | Painel Ata Commerce (azul) |
| `platform` | Platform Hub (verde) |
| `store` | Vitrine tenant (`[data-store-theme]`) |

CTAs de marca na vitrine continuam com `.btn-primary` / `--cor-primaria` — não usar `Button variant="primary"` nesses casos.

## CSS nos apps

### Admin (`apps/admin/src/index.css`)

1. `@lojao/design-tokens` (primitivos + temas admin/platform)
2. `@lojao/design-tokens/shadcn-bridge.css`
3. `@lojao/ui/styles/shadcn.css`
4. `components.css`
5. `tailwindcss` + `@source` em `packages/ui/src`

Alias `@/` no Vite/tsconfig do admin aponta para `packages/ui/src` (imports internos shadcn).

### Storefront (`apps/storefront/src/app/globals.css`)

1. tokens store + `shadcn-bridge.css` (escopo `[data-store-theme]`)
2. `@lojao/ui/styles/shadcn.css`
3. `tailwindcss` + `@source` em `packages/ui/src`

`next.config.ts`: `transpilePackages: ['@lojao/ui']` + aliases `@/components/ui` e `@/lib/utils` para resolução interna do pacote.

## Adicionar componente shadcn

```bash
cd packages/ui
pnpm dlx shadcn@latest add button
```

Grava em `src/components/ui/`. Criar ou atualizar **facades** para manter `surface`, `testId`, `data-testid`. Exportar no `index.ts` e, se útil, subpath em `package.json`.

**Regra:** apps importam `@lojao/ui` — **nunca** `@radix-ui/*` ou `radix-ui` direto.

**Bordas:** primitivos shadcn devem usar `border-border` (ou herdar via `@layer base` em `shadcn.css`). Cor vem de `--admin-border` / `--platform-border` / `--store-border` no bridge.

## Comandos

```bash
pnpm --filter @lojao/ui typecheck
pnpm turbo typecheck --filter=@lojao/ui --filter=admin --filter=storefront
pnpm --filter admin build
pnpm --filter storefront build
STRICT=1 make check-design
pnpm test:all   # smoke E2E
```

## Exports

- `"."` — facades + reexports selecionados
- Subpaths: `@lojao/ui/{button,dialog,select,…}` — primitivos avançados
