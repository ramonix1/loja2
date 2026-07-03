# Princípios de UX — Ata Commerce / Lojão

Documento de referência para **admin**, **storefront** e fluxos de onboarding. Complementa specs de fase.

---

## Público principal

**Pequenos negócios e vendedores simples** — MEI, loja de bairro, artesanato, revenda, food service, etc.

Características típicas:

- Usam o **celular** como dispositivo principal (WhatsApp, Instagram, PIX)
- Tempo limitado; querem resolver rápido (“ver pedido”, “mudar preço”)
- Baixa tolerância a termos técnicos (slug, tenant, webhook)
- Não leem manuais; aprendem tocando

---

## Mobile-first (obrigatório)

1. **Breakpoints:** layout e tipografia pensados primeiro em ~360–430px de largura; `sm:`/`md:` expandem, não o contrário.
2. **Touch:** alvos mínimos ~**48×48px**; `touch-manipulation`; evitar hover como única affordance.
3. **Safe areas:** `env(safe-area-inset-*)` em footers fixos (iPhone).
4. **Viewport:** telas de escolha/login/hub em **full-screen** (`min-h-dvh`), conteúdo edge-to-edge com padding lateral modesto — evitar card estreito centralizado.
5. **Densidade:** preferir **blocos/cards em grid** (1 col mobile → 2+ desktop) em vez de listas compactas.
6. **Texto:** frases curtas, verbos de ação (“Entrar na loja”, “Ver pedidos”).

---

## Temas — escopo atual

| Onde | Light/dark | Como |
|------|------------|------|
| **Admin** (+ login, my-stores) | **Sim** | Botão ícone sol/lua (`ThemeIconToggle`) → `data-admin-ui-theme` |
| **Platform Hub** | **Sim** | Botão ícone sol/lua → `data-platform-ui-theme` |
| **Vitrine** `/store/*` | **Não** | Tema **claro fixo** (`data-store-theme="claro"`); visitante não troca |

**Aparência da loja** (logo, nome, cor CTA) = lojista configura em `/admin/aparencia`, persiste em `configuracoes` (`loja_*`). **Toggle de tema da vitrine foi removido** (initiative dark-theme-icons I3).

**Tema do painel** (light/dark do admin/platform) = preferência do operador no browser; **não** altera como a vitrine aparece para clientes.

**Governança:** CI roda `STRICT=1 make check-design` — proíbe reintroduzir `gray-*`, `blue-*` ou `#2563eb` em admin/storefront/ui. Swatch de tokens em `/admin/diagnostico` (`admin-diagnostico-token-swatch`).

Plano histórico: [`THEME-MIGRATION-PLAN.md`](./THEME-MIGRATION-PLAN.md). Tokens escuro admin/platform alinhados ao PDF Dark Theme (DT0): [`dark-theme-icons-DT0-audit.md`](../specs/dark-theme-icons-DT0-audit.md).

## Ícones (mobile-first)

| Camada | Onde | Regra |
|--------|------|-------|
| **Produto** | admin, platform, vitrine | `IconButton`, `ThemeIconToggle` e barrel `@lojao/ui/icons` (`react-icons` hi2) |
| **Primitivos shadcn** | `@lojao/ui/components/ui` | `lucide-react` apenas (Dialog, Sheet close, etc.) |
| **Touch** | Ações CRUD, nav, carrinho | Alvo mínimo **48×48px** (`IconButton` `size="lg"`) ou **44px** em tabelas (`size="md"`) |
| **Acessibilidade** | Botões ícone | `aria-label` + `title` obrigatórios; texto mantido em CTAs primários e confirmações |

Spec: [`dark-theme-icons-spec.md`](../specs/dark-theme-icons-spec.md).

## Admin lojista

| Tela | Padrão |
|------|--------|
| Login | Card compacto OK (formulário curto) |
| Merchant Hub (`/admin/my-stores`) | Full-screen, grid de blocos, botões largos |
| Dashboard / CRUD | Sidebar colapsável em mobile; tabelas com scroll horizontal ou cards |
| Aparência | Branding da loja (logo, cor) — **sem** toggle tema vitrine |
| Tema do painel | Botão ícone sol/lua — sidebar, login e my-stores incluídos |

---

## Storefront / marketing

- Vitrine e checkout: mobile-first desde Fase 5 (ver `docs/migration/phases/05-storefront-public.md`).
- Signup/onboarding: formulários em uma coluna, progresso visível, CTA fixo no rodapé quando fizer sentido.

---

## O que evitar

- Exigir slug ou IDs técnicos no login
- Listas densas estilo “settings de dev”
- Modais pequenos com muito texto
- Depender de hover ou atalhos de teclado

---

## Changelog

| Data | Mudança |
|------|---------|
| 2026-06-30 | Initiative dark-theme-icons (I6): ícones react-icons, toggle sol/lua, vitrine escuro fixo, DT0 tokens |
| 2026-06-23 | Fase 7 — CI STRICT design tokens; swatch diagnóstico; vitrine `data-store-theme` |
| 2026-06-22 | Vitrine sem toggle light/dark; futuro via Aparência |
| 2026-06-22 | Temas admin + platform (Escuro/Claro) |
| 2026-06-22 | Documento inicial; Merchant Hub redesenhado (grid full-screen) |
