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
| **Admin** (+ login, my-stores) | **Sim** | Toggle local → `data-admin-ui-theme` |
| **Platform Hub** | **Sim** | Toggle verde/creme → `data-platform-ui-theme` |
| **Vitrine** `/store/*` | **Não (por enquanto)** | Aparência da loja via admin; tema vitrine **futuro** na tabela Aparência |

**Aparência da loja** (logo, nome, cor CTA, eventualmente modo escuro/claro da vitrine) = lojista configura em `/admin/aparencia`, persiste em `configuracoes` (`loja_*`). Visitante **não** edita.

**Tema do painel** (light/dark do admin) = preferência do operador no browser; **não** altera como a vitrine aparece para clientes.

**Governança:** CI roda `STRICT=1 make check-design` — proíbe reintroduzir `gray-*`, `blue-*` ou `#2563eb` em admin/storefront/ui. Swatch de tokens em `/admin/diagnostico` (`admin-diagnostico-token-swatch`).

Plano completo: [`THEME-MIGRATION-PLAN.md`](./THEME-MIGRATION-PLAN.md) §2.3 (vitrine futura).

## Admin lojista

| Tela | Padrão |
|------|--------|
| Login | Card compacto OK (formulário curto) |
| Merchant Hub (`/admin/my-stores`) | Full-screen, grid de blocos, botões largos |
| Dashboard / CRUD | Sidebar colapsável em mobile; tabelas com scroll horizontal ou cards |
| Aparência | Branding + (futuro) modo da vitrine via `loja_*` — **não** é o toggle do painel |
| Tema do painel | Toggle light/dark — sidebar, login e my-stores incluídos |

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
| 2026-06-23 | Fase 7 — CI STRICT design tokens; swatch diagnóstico; vitrine `data-store-theme` |
| 2026-06-22 | Vitrine sem toggle light/dark; futuro via Aparência |
| 2026-06-22 | Temas admin + platform (Escuro/Claro) |
| 2026-06-22 | Documento inicial; Merchant Hub redesenhado (grid full-screen) |
