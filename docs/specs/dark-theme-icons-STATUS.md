# Status — Dark Theme System + Ícones

> **Agente implementador:** atualize este arquivo ao concluir cada fase. Spec: [dark-theme-icons-spec.md](./dark-theme-icons-spec.md)

## Fase ativa

| Campo | Valor |
|-------|-------|
| **Fase ativa** | — (initiative concluída) |
| **Iniciada em** | 2026-06-25 |
| **Concluída em** | 2026-06-30 |
| **Spec version** | 1.0 |
| **Responsável** | Agente implementador |

## Progresso por fase

| Fase | Nome | Status | Data conclusão | Notas |
|------|------|--------|----------------|-------|
| DT0 | Audit PDF Dark Theme → tokens | `done` | 2026-06-30 | PDF lido; primitivos `--ata-dt-*`; semantic escuro admin/platform; ver [dark-theme-icons-DT0-audit.md](./dark-theme-icons-DT0-audit.md) |
| I1 | Foundation react-icons + IconButton | `done` | 2026-06-30 | `@lojao/ui` — react-icons 5.7.0, IconButton + barrel `@lojao/ui/icons` |
| I2 | Toggle tema sol/lua (admin + platform) | `done` | 2026-06-30 | `ThemeIconToggle` (`@lojao/ui`) sol/lua; testids mantidos; E2E theme 5/5 |
| I3 | Remover tema vitrine (Aparência + API + store) | `done` | 2026-06-30 | Switch removido; vitrine fixa escuro (API+layout); E2E vitrine 4/4, aparencia 2/2, API 6/6 |
| I4 | Ícones admin CRUD + shell | `done` | 2026-06-30 | I4.1–I4.6: shell nav+footer, CRUD IconButtons, layout-admin HiOutlineBars3 |
| I5 | Ícones storefront (carrinho, nav) | `done` | 2026-06-30 | Nav+Sheet mobile; cart trash/qty; banner chevrons; testids novos |
| I6 | QA + docs + CI | `done` | 2026-06-30 | design-system §11, UX-PRINCIPLES, test-ids-catalog, icons.spec.ts; check-design + typecheck + API 160/160 |

Status permitidos: `pending` | `in_progress` | `blocked` | `done`

## Decisões fechadas (2026-06-25)

- Light/dark **somente** admin lojista + Platform Hub Atalabs
- **Remover** configuração `loja_tema` da UI Aparência e fixar vitrine escuro
- Toggle tema: **ícone sol/lua** (react-icons), não Switch com label
- Biblioteca app-level: **react-icons** via `@lojao/ui` (lucide permanece em primitivos shadcn)

## Bloqueios / pendências

_Nenhum._

## Checklist visual (375px + desktop)

| Área | Escuro | Claro | Ícones OK |
|------|--------|-------|-----------|
| Admin login + toggle | ☑ | ☐ | ☑ (I2 sol/lua) |
| Admin sidebar footer | ☑ | ☐ | ☑ (I2 toggle + I4 nav/footer) |
| Platform login + sidebar | ☑ | ☐ | ☑ (I2 toggle + I4 nav/footer) |
| Aparência (sem tema vitrine) | ☑ | n/a | ☑ (I3 Switch removido) |
| Vitrine `/store/demo` | ☑ | n/a (fixo escuro) | ☑ (I5 nav + menu mobile) |
| Carrinho mobile | ☑ | n/a | ☑ (I5 trash + qty ícones) |

> Escuro validado via Playwright — screenshots em `docs/specs/dt0-screenshots/` (atualizadas 2026-07-01 pós I6; script `scripts/capture-dt0-screenshots.mjs`).

## Log de entregas

<!-- Formato: YYYY-MM-DD — Fase XX — resumo -->
- 2026-06-30 — I6 — QA + docs + CI. `design-system.md` §11: escopo vitrine escuro fixo, tokens DT0 escuro admin/platform, seção ícones (`IconButton`, `ThemeIconToggle`, `@lojao/ui/icons`). `UX-PRINCIPLES.md` temas + ícones mobile-first. `test-ids-catalog.md` atualizado (theme toggle, store nav/menu, tema vitrine removido). Novo E2E `store/icons.spec.ts` (2/2). Prompts: `docs/specs/prompts/dark-theme-icons/README.md`. Spec status `done`. Verificação: `STRICT=1 make check-design` OK, typecheck 11/11, API 160/160; E2E smoke initiative (theme 5/5, icons 2/2, vitrine/aparencia) verde — 2 falhas pré-existentes em `merchant-hub.spec` (roteamento my-stores, fora do escopo).
- 2026-06-25 — Spec — Análise codebase + STATUS v1.0 (spec referenciada, arquivo ausente no workspace).
- 2026-06-30 — Spec — `dark-theme-icons-spec.md` v1.0 criada: inventário completo (admin/platform/storefront), fases DT0–I6, decisão remover `loja_tema` da Aparência, toggle sol/lua, react-icons via `@lojao/ui`.
- 2026-06-30 — I1 — Foundation react-icons + IconButton. Adicionado `react-icons@^5.4.0` (resolvido 5.7.0) em `@lojao/ui`. Novos: `src/icon-button.tsx` (`IconButton` com `surface` admin/platform/store, variantes `ghost`/`destructive`/`accent`, `size` md 44px / lg 48px default, `aria-label`+`title`, suporte `href`/`external`, `testId`) e `src/icons/index.ts` (barrel react-icons hi2 §4.3 + aliases `ActionIcons`/`NavIcons`). Exportados em `index.ts` e subpath `./icons` no `package.json`. DoD: typecheck monorepo verde (11/11), zero lints.
- 2026-06-30 — I5 — Ícones storefront (sem toggle tema). `StoreNav`: Carrinho (`NavIcons.cart`, testid `store-nav-cart`), Pedidos, Sair/Entrar com ícones `NavIcons`/`ActionIcons`; prop `stacked` para menu mobile. Novo `store-header-nav.tsx`: nav desktop + hamburger `IconButton` (`store-header-menu`) + `Sheet` lateral (mobile-first); `store-header.tsx` delega ao client nav. `cart-view`: qty −/+ e Remover via `IconButton` (`surface="store"`, trash `destructive`). `add-to-cart-button` + `product-card`: ícone carrinho leading. `banner-carousel`: setas `ActionIcons.prev/next`. Testids: `store-nav-cart`, `store-header-menu` em `@lojao/test-utils`. DoD §7: typecheck 11/11, vitrine permanece escuro (I3).
- 2026-06-30 — I4 — Ícones admin CRUD + shell (I4.1–I4.6). Novos: `apps/admin/src/components/crud-icon-buttons.tsx` (View/Edit/Delete/Save/ToggleActive/Prev/Next/ImageRemove/BackLink helpers sobre `IconButton` + `ActionIcons`); `apps/admin/src/lib/admin-nav-items.ts` (NAV_ITEMS com `NavIcons` §4.3). Shell: sidebar admin (12 rotas + ícones), footer (vitrine/trocar loja/sair com ícones); platform sidebar Lojas + Sair; `layout-admin.tsx` hamburger migrado de lucide `MenuIcon` → `HiOutlineBars3`; my-stores “Entrar na loja” com `ArrowRight`; platform tenants Ver vitrine/Detalhes/Nova loja com ícones. CRUD: produtos (Ver/Editar/Excluir/estoque ✓/remover imagem), categorias, banners (Editar/Ativar-Desativar/Excluir), permissões (Suspender/Remover), chat bot, agenda remover dia, pedidos (Ver/paginação ←→), compradores (Ver ficha/Voltar), dashboard “Ver todos” chevron, produtos/edit trash imagem, platform detail Voltar. Ações destrutivas `variant="destructive"`; testids existentes preservados. DoD §7: typecheck 11/11.
- 2026-06-30 — I3 — Remover tema vitrine (decisão produto D5). UI Aparência: removido `Switch` "Tema claro" + estado `tema`/`setTema`; `loja_tema` não é mais enviado no PUT; preview do header fixo em `data-store-theme="escuro"`. API: `aparencia.service` ignora `loja_tema` recebido e sempre persiste/retorna `DEFAULT_STORE_THEME`; `public.service` retorna `tema: escuro` (visitante nunca troca). Storefront `store/[slug]/layout.tsx`: `data-store-theme="escuro"` fixo. Types: `loja_tema` marcado `@deprecated` (mantido por backward compat de payload). Test-ids: `adminAparencia.temaSwitch` deprecado. Testes: API `admin.aparencia.test` ajustado (PUT claro → retorna escuro) 6/6; E2E `vitrine.spec` assert `escuro` fixo 4/4; `aparencia.spec` 2/2. DoD §7: typecheck 11/11, sem regressão.
- 2026-06-30 — I2 — Toggle sol/lua (admin + platform). Novo `ThemeIconToggle` em `@lojao/ui` (`src/theme-icon-toggle.tsx`, exportado em `index.ts`): wrapper de `IconButton` ghost 48px — escuro→sol "Ativar tema claro", claro→lua "Ativar tema escuro". Refatorados `admin-ui-theme-switch.tsx` e `platform-ui-theme-switch.tsx` para usar o toggle (removidos `Switch` + label "Tema claro"); `inset=false` (auth) mantém card com borda/surface. Testids `admin-ui-theme-switch`/`platform-ui-theme-switch` preservados (compat E2E); persistência localStorage inalterada. DoD §7: typecheck 11/11 verde, zero lints, E2E `theme.spec.ts` 5/5 (login + toggle admin/platform).
- 2026-06-30 — DT0 — Audit PDF Dark Theme → tokens. PDF `AtaLabs_-_Dark_Theme_System.pdf` extraído (5 páginas). Delta: fundos neutros `#13151A`/`#13161A` (admin/platform escuro); acentos `#2E8FFB`/`#639922`; texto off-white; nav active `#152038`/`#1C2614`; removidos gradientes auth escuro. Novos: `dark-theme-primitives.css`, `--ata-verde-broto-hover`. Audit: [dark-theme-icons-DT0-audit.md](./dark-theme-icons-DT0-audit.md). QA visual: Playwright 8 screenshots + 14/14 tokens CSS — `docs/specs/dt0-screenshots/`. `make check-design` verde.
