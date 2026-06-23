# STATUS — Migração shadcn/ui

| Campo | Valor |
|-------|-------|
| **Initiative** | [shadcn-ui-migration-spec.md](./shadcn-ui-migration-spec.md) |
| **Fase ativa** | — (initiative concluída) |
| **Última atualização** | 2026-06-23 |

---

## Progresso

| Fase | ID | Descrição | Status |
|------|-----|-----------|--------|
| S0 | `shadcn-s0` | Fundação — init, bridge CSS, deps | `done` |
| S1 | `shadcn-s1` | Button, Card, Switch, Badge, Input | `done` |
| S2 | `shadcn-s2` | Table, Skeleton, Tabs, ChartCard | `done` |
| S3 | `shadcn-s3` | Dialog, Select, Dropdown, forms CRUD | `done` |
| S4 | `shadcn-s4` | Sheet mobile, ScrollArea sidebar | `done` |
| S5 | `shadcn-s5` | Storefront piloto (checkout/auth) | `done` |
| S6 | `shadcn-s6` | Limpeza, docs, governança | `done` |

**Legenda:** `pending` · `in_progress` · `done` · `blocked`

---

## Log de entrega

### S0 — Fundação (2026-06-23)

- `components.json` (`new-york-v4`) + deps `@radix-ui/react-slot`, CVA, clsx, tailwind-merge, tw-animate-css
- `packages/design-tokens/src/shadcn-bridge.css` — mapeamento admin + platform → variáveis shadcn
- `packages/ui/src/styles/shadcn.css` — `@theme inline` Tailwind 4
- `packages/ui/src/lib/utils.ts` — `cn()` shadcn; `cn.ts` reexporta para compatibilidade
- Import bridge + shadcn.css em `apps/admin/src/index.css` (antes de `components.css`)
- `packages/ui/README.md` — comandos CLI documentados
- **DoD:** `pnpm turbo typecheck --filter=@lojao/ui --filter=admin` OK; `pnpm --filter admin build` OK; `make check-design` OK

**Nota:** CLI `shadcn init` não detecta framework em `packages/ui` (lib sem Vite); setup manual conforme [installation/manual](https://ui.shadcn.com/docs/installation/manual).

### S1 — Primitivos (2026-06-23)

- CLI: `button`, `card`, `switch`, `badge`, `label`, `input` em `src/components/ui/`
- Facades: `button.tsx`, `card.tsx`, `switch.tsx` → wrappers shadcn (API `surface`, `variant`, `testId` preservada)
- Exports: `Badge`, `Input`, `Label` + subpaths `@lojao/ui/{button,card,switch,badge,label,input}`
- Admin: alias `@/` em `tsconfig` + `vite.config.ts` para resolver imports shadcn
- E2E: `auth.setup.ts` e `login.spec.ts` — fluxo multi-loja (`select_tenant` → hub)
- **DoD:** typecheck + build admin OK; smoke login + theme + dashboard `@smoke` OK

### S2 — Dados e feedback (2026-06-23)

- CLI: `table`, `skeleton`, `tabs`, `alert`, `separator` em `src/components/ui/`
- Facade `table.tsx` — shadcn `TableHeader`/`TableRow`/`TableCell` + wrapper `.ds-scrollbar`
- `StatusBadge` + `statusBadgeClass` (substitui `ds-badge` em rotas admin); `adminStatusBadgeClass` reexportado
- `ChartCard` — `CardHeader`/`CardTitle`/`CardDescription` shadcn
- Dashboard charts — loading com `Skeleton` shadcn
- Relatórios: **mantidas** pills `adminPeriodPillClass` (visual Ata; `Tabs` disponível para S3+)
- **DoD:** typecheck + build OK; smoke pedidos + produtos `@smoke` OK

### S3 — Formulários e overlays (2026-06-23)

- CLI: `dialog`, `select`, `dropdown-menu`, `textarea`, `checkbox` + `lucide-react`
- Facades: `FieldInput`, `FieldTextarea`, `FieldNativeSelect`, `ConfirmDialog` (Radix Dialog)
- Rotas migradas: `configuracoes`, `aparencia`, `produtos/*`, `categorias/*`, `banners/form`, `pedidos/detail`, `platform/tenants/*`
- Toggles `configuracoes` → `Switch` shadcn; exclusões/destrutivas → `ConfirmDialog` (sem `window.confirm`)
- Checkbox shadcn em `banners/form`; zero `adminInputClass` / `platformInputClass` nos paths S3
- **DoD:** typecheck + build OK; smoke configuracoes + aparencia + pedidos + produtos + platform OK

### S4 — Layout mobile (2026-06-23)

- CLI: `sheet`, `scroll-area` em `src/components/ui/`
- `SidebarPanel` — nav com `ScrollArea` shadcn (substitui `.ds-scrollbar` na sidebar)
- `LayoutAdmin` — aside desktop (`lg+`) + header hamburger + `Sheet` lateral (`< lg`); admin e platform
- API: `renderSidebar(closeMobileMenu)` + `mobileMenuTestId`; layouts admin/platform migrados
- Test IDs: `admin.mobileMenuBtn`, `platform.mobileMenuBtn`
- **DoD:** typecheck + build OK; smoke theme `@smoke` OK; `make check-design` OK

### S5 — Storefront piloto (2026-06-23)

- `@lojao/ui` em `apps/storefront`; `transpilePackages` + aliases webpack/turbopack (`@/components/ui`, `@/lib/utils`) + paths no `tsconfig`
- Bridge `[data-store-theme]` em `shadcn-bridge.css`; imports bridge + `shadcn.css` em `globals.css`; `@source` para `packages/ui`
- `storeInputClass` + `UiSurface` `'store'`; `FieldInput` / `Button` com tokens vitrine
- Migrados: `login-form` (`FieldInput`), `checkout-form` (`FieldInput` + `Button` secundário “Buscar”)
- CTAs primários mantêm `btn-primary` / `--cor-primaria` tenant (spec)
- **DoD:** typecheck + `next build` OK; `make check-design` OK; smoke store bloqueado por seed E2E (`Nenhuma loja encontrada para este e-mail`) — pré-existente, não regressão UI

### S6 — Limpeza e governança (2026-06-23)

- **Bordas:** `@layer base { border-border }` em `shadcn.css`; primitivos Card/Dialog/Alert/Select/Dropdown/Sheet com `border-border` explícito
- **Tokens:** `--admin-border` / `--admin-input-border` e `--store-input-border` (escuro) — mix azul comercio ~20% (substitui gelo/branco)
- Docs: `design-system.md` §12 shadcn, `test-ids-catalog.md` (mobile menu), `packages/ui/README.md` completo
- Facades shadcn mantidas (não há implementação legada paralela); apps sem import Radix direto
- **DoD:** typecheck + build admin/storefront OK; `STRICT=1 make check-design` OK; smoke theme admin OK

---

## Bloqueios / decisões abertas

| # | Tema | Opções | Decisão |
|---|------|--------|---------|
| 1 | Estilo shadcn | `new-york` vs `default` | **new-york** (recomendado na spec) |
| 2 | Ícones | `lucide-react` vs heroicons | **lucide** (padrão shadcn) — confirmar bundle |
| 3 | Relatórios tabs | shadcn `Tabs` vs pills custom | **Manter pills** (`adminPeriodPillClass`) — S2 |
| 4 | react-hook-form | Adotar em S3 ou inputs controlados simples | Preferir RHF+Zod em forms longos |

---

## Comandos úteis

```bash
# Após S0
cd packages/ui && pnpm dlx shadcn@latest add button card switch

pnpm turbo typecheck --filter=@lojao/ui --filter=admin
pnpm test:all   # smoke
STRICT=1 make check-design
```
