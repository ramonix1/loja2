# Spec — Refatoração UI do Shell Admin (Platform Ops + Lojista)

| Campo | Valor |
|-------|-------|
| **Initiative ID** | `admin-shell-ui` |
| **Status** | `draft` |
| **Escopo** | `apps/admin` (Platform Hub `/platform/*` + Admin lojista `/admin/*`) + `packages/ui` |
| **Referência visual** | Dashboard SaaS multi-loja (Stellarsync — mockup interno) |
| **Princípios** | [`docs/design/UX-PRINCIPLES.md`](../design/UX-PRINCIPLES.md) · [`design-system.md`](./design-system.md) |
| **Depende de** | shadcn S4 (Sheet/ScrollArea) `done` · dark-theme-icons I2 `done` |
| **Complementa** | [`ata-labs-platform-spec.md`](./ata-labs-platform-spec.md) · [`shadcn-ui-migration-spec.md`](./shadcn-ui-migration-spec.md) |
| **Fora da migração** | Initiative pós-Fase 8; não altera contratos de checkout |

---

## 1. Objetivo

Modernizar o **Platform Ata Labs Ops** e extrair um **shell de navegação reutilizável** (sidebar + header + área de conteúdo) para uso também no **admin lojista**, alinhado a dashboards SaaS atuais (2024–2026).

**Resultado esperado para o operador Ata Labs:**

- Visão consolidada de **KPIs da plataforma** (lojas, vendas, pedidos, crescimento) numa faixa densa no topo — não espalhada em cards soltos.
- **Gestão de lojas em grid de cards ricos** (status, plano, performance, ações) com busca, filtros, alternância grid/lista e paginação.
- Navegação **agrupada e escalável** (Dashboard, Lojas, Merchants, Relatórios, Configurações…) em vez de sidebar com um único item.

**Resultado esperado para o lojista:**

- Mesmo **padrão de shell** (sidebar agrupada, header com breadcrumbs, ações globais no topo).
- Dashboard existente reorganizado sobre o novo layout — sem perder gráficos e pedidos recentes.

**Não é objetivo:** copiar pixel-perfect o mockup (verde Stellarsync, ratings fictícios, “Premium Access”). Identidade permanece **Ata Labs verde** (platform) e **Ata Commerce azul** (admin).

---

## 2. Análise da referência (pontos fortes)

### 2.1 Shell — Sidebar

| Elemento | Comportamento | Valor para Ata |
|----------|---------------|----------------|
| **Brand block** | Logo + wordmark no topo, área fixa | Reforço de marca Ata Labs / Ata Commerce |
| **Busca global** | Input pill com ícone + atalho `⌘K` / `Ctrl+K` | Saltar para loja, pedido, produto, página |
| **Grupos de nav** | Rótulos em caps (`MAIN MENU`, `FEATURES`, `OTHER`) | Organizar 10+ itens sem lista infinita |
| **Itens com ícone** | Linha única, estado ativo com fundo sutil | Já temos ícones — falta agrupamento e hierarquia |
| **Sub-nav expansível** | Item pai + filhos indentados (ex.: Store → Online/Offline) | Lojas → Todas / Suspensas; Pedidos → Pendentes |
| **Perfil no rodapé** | Avatar, nome, handle/e-mail, chevron dropdown | Substituir texto plano + logout solto no footer |
| **Largura generosa** | ~260–280px, respiro vertical | Sidebar atual `w-60` (240px) é funcional mas apertada para busca + grupos |

### 2.2 Shell — Header (desktop)

| Elemento | Comportamento | Valor para Ata |
|----------|---------------|----------------|
| **Breadcrumbs** | `Main Menu / Store` + setas voltar/avançar | Contexto em telas profundas (detalhe loja, pedido) |
| **Ações utilitárias** | Chat, notificações (badges) | Chat admin já existe; alertas de pedidos/platform |
| **CTA secundário** | “Customize Widget” | Equivalente: “Ver vitrine”, “Impersonar”, “Exportar” |
| **Toggle tema** | Sol/lua no header (não escondido na sidebar) | Descoberta imediata; sidebar fica só navegação |
| **CTA primário contextual** | “Premium Access” (escuro, destaque) | Platform: upgrade plano merchant; Admin: ação da página |

**Observação crítica:** a referência usa **header persistente em desktop**. Nosso `LayoutAdmin` hoje **não tem header desktop** — só hamburger em mobile.

### 2.3 Conteúdo — Dashboard / listagem

| Elemento | Comportamento | Valor para Ata |
|----------|---------------|----------------|
| **Faixa KPI unificada** | Um card branco, 2 linhas × N colunas, divisores verticais | Densidade alta; scan rápido vs. 9 cards separados |
| **KPIs primários** | Contagens operacionais (total, online, offline, abertas, fechadas) | Platform: total lojas, ativas, suspensas, trial, etc. |
| **KPIs secundários** | Métricas de performance (vendas, pedidos, crescimento %, top store) | Platform: GMV agregado, pedidos 30d, loja destaque |
| **Toolbar de listagem** | Busca + Filtro + toggle grid/lista + CTA “Add” | Padrão de mercado para CRUD em escala |
| **Cards de entidade** | Logo, nome, rating/status badge, grid 2×2 metadados, 2 CTAs footer | Lojas com plano, slug, merchant, datas, performance |
| **Paginação** | Anterior/Próximo + números + “Showing X–Y of Z” + “Show all” | Essencial com dezenas/centenas de lojas |
| **Estados visuais** | Performance colorida (Good / Average / Needs Attention) | Mapear: saudável / atenção / suspensa / trial expirando |

### 2.4 Design language (adaptável)

| Token | Referência | Adaptação Ata |
|-------|------------|---------------|
| Fundo app | Cinza muito claro `#F4F7F6` | `--platform-bg` / `--admin-bg` modo claro |
| Superfície card | Branco, radius ~10px, sombra sutil | `@lojao/ui` Card + tokens existentes |
| Accent primário | Verde | Platform: `--platform-accent` · Admin: `--admin-accent` |
| Status | Pills verde/vermelho/laranja | Reutilizar `StatusBadge` + variantes semânticas |
| Tipografia KPI | Número grande bold + label pequena cinza | Novo componente `KpiStrip` / `KpiCell` |

---

## 3. Diagnóstico do layout atual

Inventário com base em `apps/admin/src/routes/**` e `packages/ui/src/layout-admin.tsx` (jul/2026).

### 3.1 Platform Hub (`/platform/*`)

| Área | Estado atual | Problema |
|------|--------------|----------|
| **Rotas** | `/platform/stores`, `/novo`, `/:slug` | Sem dashboard; redirect index → lista |
| **Nav** | 1 item: “Lojas” (`PLATFORM_NAV_ITEMS`) | Sidebar subutilizada; parece app incompleto |
| **Header desktop** | Inexistente | Sem breadcrumbs, busca, notificações, tema no topo |
| **Lista de lojas** | Rows horizontais (`platform-store-row`) | Baixa densidade informativa; não escala visualmente |
| **Métricas** | Nenhuma | Operador não vê saúde da plataforma ao entrar |
| **Busca/filtro** | Nenhum | Lista completa sempre; ruim com 50+ lojas |
| **View modes** | Só lista | Sem grid cards (referência) nem toggle |
| **Paginação** | Nenhuma | Tudo carregado de uma vez |
| **Detalhe loja** | Form estreito `max-w-lg` | Pouco contexto; sem tabs (Overview, Billing, Logs) |
| **Perfil operador** | Nome em texto no footer sidebar | Sem avatar, menu conta, preferências |
| **Tema** | Switch no footer sidebar | Baixa descoberta vs. header global |
| **Logout** | Botão vermelho no footer | OK funcional; deveria estar no menu perfil |

### 3.2 Admin lojista (`/admin/*`)

| Área | Estado atual | Problema |
|------|--------------|----------|
| **Nav** | 12 itens flat, sem grupos | Lista longa; difícil scan (Dashboard até Chat) |
| **Header desktop** | Inexistente | Mesmo gap do platform |
| **Dashboard** | 5 cards + 4 cards + gráficos + tabela | KPIs fragmentados; não há faixa unificada |
| **Breadcrumbs** | Nenhum | Em `/admin/pedidos/123` falta contexto |
| **Busca global** | Nenhum | Lojista mobile precisa achar pedido/produto rápido |
| **Merchant hub** | `/admin/my-stores` com cards | **Melhor** que platform stores — inconsistência interna |
| **Ações sidebar** | Ver vitrine, Trocar loja, tema, logout | Muita coisa no footer; deveria migrar para header/perfil |
| **Impersonation banner** | Full-width acima do conteúdo | OK; integrar ao header como alerta |

### 3.3 Shell compartilhado (`LayoutAdmin` + `SidebarPanel`)

| Aspecto | Atual | Gap vs. mercado |
|---------|-------|-----------------|
| Estrutura | Sidebar fixa + `<main>` sem header desktop | 90% dos SaaS modernos: sidebar + topbar |
| Mobile | Sheet + header mínimo (só hamburger) | Falta título página + ações no header mobile |
| Largura sidebar | `w-60` (240px) | Referência ~272px; busca global precisa mais espaço |
| Extensibilidade | `renderSidebar` callback | Bom — evoluir para `AppShell` com slots header/toolbar |
| Tokens | `--admin-*` / `--platform-*` | Suficientes; falta tokens de `--shell-*` neutros |

### 3.4 API / dados (Platform)

Endpoint atual: `GET /api/v1/platform/stores` → lista básica (`slug`, `nome`, `plano`, `ativo`, `createdAt`).

**Ausente para UI alvo:**

- Agregados dashboard (totais, growth, top store)
- Métricas por loja (pedidos 30d, receita, último pedido)
- Filtros server-side (status, plano, busca texto)
- Paginação cursor/offset
- Logo da loja (tenant `loja_logo`)

---

## 4. Falhas vs. dashboards de mercado (Shopify, Stripe, Vercel, Linear)

| Padrão de mercado | Nosso estado | Impacto |
|-------------------|--------------|---------|
| **Overview primeiro** (KPIs + atividade recente) | Platform abre em lista CRUD | Operador perde visão sistêmica |
| **Topbar persistente** | Só sidebar | Desorientação; ações escondidas |
| **Command palette** (`⌘K`) | Não existe | Power users e suporte lentos |
| **Nav agrupada + colapsável** | Lista flat | Sidebar “infinita” conforme features crescem |
| **Entity cards** em grid | Platform: rows; Admin hub: cards | Inconsistência; platform parece beta |
| **Filtros + sort + paginação** | Client-side total | Quebra com escala |
| **Empty states acionáveis** | Platform: texto; Hub: e-mail suporte | Perda de conversão (criar loja, docs) |
| **Notificações / inbox** | Chat isolado na nav | Pedidos urgentes não “cut through” |
| **Responsividade mobile-first** | Sidebar OK; conteúdo desktop-first em platform | Operador em campo no celular sofre |
| **Skeleton loading** | “Carregando…” texto | Percepção de lentidão |
| **Consistência cross-persona** | Platform ≠ Admin shell | Custo cognitivo para quem usa ambos |

---

## 5. Modelo de shell reutilizável (extraído da referência)

### 5.1 Arquitetura alvo — `AppShell`

Novo componente em `packages/ui` (evolução de `LayoutAdmin`, não breaking change imediata):

```
┌──────────────────────────────────────────────────────────────────┐
│ AppShell (data-ui-surface=admin|platform)                        │
├─────────────┬────────────────────────────────────────────────────┤
│ AppSidebar  │ AppMainColumn                                       │
│             │ ┌────────────────────────────────────────────────┐ │
│ - Brand     │ │ AppHeader (sticky, desktop + mobile)           │ │
│ - Search    │ │ - Breadcrumbs · PageActions · Theme · Profile  │ │
│ - NavGroups │ ├────────────────────────────────────────────────┤ │
│ - UserMenu  │ │ PageToolbar (opcional, por rota)               │ │
│             │ │ - Search · Filters · ViewToggle · PrimaryCTA   │ │
│             │ ├────────────────────────────────────────────────┤ │
│             │ │ {children} — conteúdo da página                │ │
│             │ └────────────────────────────────────────────────┘ │
└─────────────┴────────────────────────────────────────────────────┘
```

**Slots / props:**

| Slot | Obrigatório | Descrição |
|------|-------------|-----------|
| `sidebar` | Sim | `AppSidebar` configurado por persona |
| `header` | Sim (default) | Breadcrumbs + ações; override por rota |
| `toolbar` | Não | Busca/filtros da página atual |
| `banner` | Não | Impersonation, trial, manutenção |
| `children` | Sim | Conteúdo |

### 5.2 `AppSidebar` — elementos

| # | Elemento | Especificação | Platform | Admin lojista |
|---|----------|---------------|----------|---------------|
| 1 | **Brand** | Logo SVG + wordmark (`Ata` extrabold + `Labs`/`Commerce`) | Ata Labs · Platform Ops | Ata Commerce · `{lojaNome}` |
| 2 | **GlobalSearch** | Input pill, placeholder contextual, badge `⌘K` | “Buscar loja, merchant…” | “Buscar pedido, produto…” |
| 3 | **NavSection** | Label caps muted, opcional collapse | Ver §5.4 | Ver §5.5 |
| 4 | **NavItem** | Ícone + label; `aria-current` se ativo | — | — |
| 5 | **NavItemExpandable** | Chevron; filhos indentados `pl-9` | Lojas → Todas, Suspensas, Nova | Pedidos → Todos, Pendentes |
| 6 | **NavDivider** | Linha ou espaço `my-2` | Entre grupos | Entre grupos |
| 7 | **UserMenu** | Avatar iniciais, nome, e-mail truncado, DropdownMenu | Conta, tema, sair | + Trocar loja, Ver vitrine |

**Comportamento mobile:** sidebar inteira no `Sheet` existente; **header mobile** mostra título + menu hamburger (padrão atual, enriquecido).

### 5.3 `AppHeader` — elementos

| # | Elemento | Especificação | Platform | Admin |
|---|----------|---------------|----------|-------|
| 1 | **MobileMenuButton** | Hamburger; abre Sheet | ✓ | ✓ |
| 2 | **Breadcrumbs** | `Home / Section / Page`; links clicáveis | Platform / Lojas / `{nome}` | Admin / Pedidos / `#123` |
| 3 | **HistoryNav** (opcional) | Setas ← → histórico router | Fase 2 | Fase 2 |
| 4 | **PageTitle** (mobile) | Truncado central ou após menu | Quando breadcrumbs longos | Idem |
| 5 | **HeaderActions** | Cluster à direita | Ver §5.6 | Ver §5.6 |
| 6 | **ThemeToggle** | `ThemeIconToggle` sol/lua | ✓ | ✓ |
| 7 | **Notifications** (fase 2) | Bell + badge count | Pedidos platform-wide | Pedidos pendentes loja |
| 8 | **Help/Docs** | Link externo docs | ✓ | ✓ |
| 9 | **PrimaryHeaderCTA** | Botão filled contextual | + Nova loja (em Lojas) | + Novo produto (em Produtos) |

**Altura:** `h-14` (56px), sticky `top-0`, borda inferior, fundo `--*-surface-elevated`.

### 5.4 Nav Platform (proposta)

| Grupo | Itens | Rota | Fase |
|-------|-------|------|------|
| **PRINCIPAL** | Dashboard | `/platform/dashboard` | P1 |
| | Lojas | `/platform/stores` | existente |
| | ↳ Todas | `/platform/stores` | P1 |
| | ↳ Suspensas | `/platform/stores?status=suspended` | P1 |
| | ↳ Nova loja | `/platform/stores/novo` | existente |
| | Merchants | `/platform/merchants` | P3 |
| **ANALYTICS** | Relatórios | `/platform/reports` | P3 |
| | Saúde / Logs | `/platform/health` | P4 |
| **SUPORTE** | Impersonações | `/platform/support` | P3 |
| **SISTEMA** | Configurações | `/platform/settings` | P4 |
| | Ajuda | link externo | P1 |

> MVP P1 pode shippar com Dashboard + Lojas (+ sub-itens) + Ajuda + Config placeholder.

### 5.5 Nav Admin lojista (proposta)

| Grupo | Itens | Rota |
|-------|-------|------|
| **PRINCIPAL** | Dashboard | `/admin/dashboard` |
| | Pedidos | `/admin/pedidos` |
| | ↳ Pendentes | `/admin/pedidos?status=pendente` |
| | Produtos | `/admin/produtos` |
| | Compradores | `/admin/compradores` |
| **CATÁLOGO** | Categorias | `/admin/categorias` |
| | Banners | `/admin/banners` |
| | Aparência | `/admin/aparencia` |
| **OPERAÇÃO** | Agenda | `/admin/agenda` |
| | Chat | `/admin/chat` |
| | Relatórios | `/admin/relatorios` |
| **LOJA** | Configurações | `/admin/configuracoes` |
| | Permissões | `/admin/permissoes` |
| **SISTEMA** | Diagnóstico | `/admin/diagnostico` |

Footer/perfil: **Trocar loja**, **Ver vitrine**, **Sair** (não repetir na nav).

### 5.6 Header actions por contexto

| Persona | Ações permanentes | Ações contextuais |
|---------|-------------------|-------------------|
| Platform | Tema, Ajuda, Perfil | Em Lojas: `+ Nova loja`; Em Dashboard: `Exportar CSV` |
| Admin | Tema, Chat (badge), Perfil | Em Produtos: `+ Produto`; Em Pedidos: filtro rápido status |

---

## 6. Platform Ops — telas alvo

### 6.1 Dashboard `/platform/dashboard` (nova)

**Bloco 1 — `PlatformKpiStrip`** (card único, responsivo):

| KPI | Fonte | Fase |
|-----|-------|------|
| Total de lojas | `COUNT(stores)` | P1 |
| Lojas ativas | `active=true` | P1 |
| Lojas suspensas | `active=false` | P1 |
| Novas (30 dias) | `createdAt` | P1 |
| Merchants | `COUNT(merchants)` | P2 |
| **Linha 2** | | |
| GMV total (30d) | agregação cross-tenant | P2 |
| Pedidos (30d) | agregação | P2 |
| Crescimento GMV % | vs. período anterior | P3 |
| Loja destaque | top by revenue 30d | P3 |
| Trials expirando (7d) | billing | P4 |

**Bloco 2 — Atividade recente**

- Tabela/card: últimas lojas criadas, últimos pedidos platform-wide, impersonações recentes (P3).

**Bloco 3 — Atalhos**

- Cards: Nova loja, Ver suspensas, Documentação suporte.

### 6.2 Lojas `/platform/stores` (refatorar)

**Toolbar (`PageToolbar`):**

| Controle | Comportamento |
|----------|---------------|
| Busca | Filtra por nome, slug, merchant (debounce 300ms) |
| Filtro | Status (ativa/suspensa), plano (starter/pro/enterprise), data criação |
| View toggle | Grid (default) / Lista compacta |
| CTA | `+ Nova loja` (primário, verde platform) |

**Grid — `PlatformStoreCard`:**

```
┌─────────────────────────────────────────┐
│ [logo] Nome da Loja          [Ativa ●] │
│        ★ — (sem reviews MVP)            │
├─────────────────────────────────────────┤
│ Plano          │ Performance            │
│ starter        │ ● Saudável / Atenção   │
│ Merchant       │ Slug                   │
│ acme-ltd       │ /store/acme            │
├─────────────────────────────────────────┤
│ [ Ver vitrine ]  [ Editar loja ]        │
└─────────────────────────────────────────┘
```

**Lista —** evolução do `platform-store-row` atual com mesmas colunas.

**Paginação:** 20 por página; `Showing 1–20 of N`; mobile: infinite scroll opcional P3.

**Empty state:** Ilustração leve + “Crie sua primeira loja” + CTA.

### 6.3 Detalhe loja `/platform/stores/:slug` (refatorar)

- Layout wide (`max-w-4xl`+), tabs: **Visão geral** | **Merchant** | **Billing** (P4) | **Ações**.
- Header da página: breadcrumb + status badge + botões Impersonar / Suspender.
- Sidebar direita (desktop): resumo KPIs da loja (P2).

---

## 7. Admin lojista — ajustes sobre o shell

| Tela | Mudança |
|------|---------|
| **Dashboard** | Substituir 9 cards soltos por `KpiStrip` (linha 1: operação do dia; linha 2: receita/produtos) + manter gráficos abaixo |
| **Todas as CRUD** | Breadcrumbs no header; CTA primário no header quando aplicável |
| **My Stores** | Manter layout full-screen (sem sidebar) — exceção documentada; visual alinhado aos cards platform |
| **Login / Platform login** | Fora do escopo — permanecem full-screen |

---

## 8. Componentes novos (`packages/ui`)

| Componente | Descrição | testid prefix |
|------------|-----------|---------------|
| `AppShell` | Layout sidebar + header + main | `app-shell` |
| `AppSidebar` | Brand, search, nav groups, user | `app-sidebar` |
| `AppHeader` | Breadcrumbs, actions | `app-header` |
| `PageToolbar` | Search, filter, view toggle | `page-toolbar` |
| `KpiStrip` / `KpiCell` | Faixa métricas 1–2 linhas | `kpi-strip` |
| `NavGroup` / `NavItem` / `NavSubItem` | Nav agrupada | `nav-group` |
| `UserMenu` | Avatar dropdown | `user-menu` |
| `CommandPalette` | Dialog `⌘K` (shadcn Command) | `command-palette` |
| `PlatformStoreCard` | Card loja platform | `platform-store-card` |
| `ViewToggle` | Grid/list icons | `view-toggle` |
| `PaginationBar` | Paginação + summary | `pagination-bar` |

**Estratégia:** implementar facades em `@lojao/ui`; tokens via `surface` prop (`admin` | `platform`).

---

## 9. API — endpoints novos (Platform)

| Método | Rota | Resposta | Fase |
|--------|------|----------|------|
| `GET` | `/api/v1/platform/dashboard/stats` | `{ data: PlatformDashboardStats }` | P1 |
| `GET` | `/api/v1/platform/stores` | query: `q`, `status`, `plano`, `page`, `limit` | P1 |
| `GET` | `/api/v1/platform/stores/:slug/metrics` | KPIs da loja | P2 |

**Tipo sugerido (`packages/types`):**

```typescript
export interface PlatformDashboardStats {
  totalStores: number;
  activeStores: number;
  suspendedStores: number;
  newStores30d: number;
  totalMerchants: number;
  orders30d: number | null;      // P2 — null se agregação indisponível
  gmv30dCents: number | null;
  gmvGrowthPct: number | null;
  topStore: { slug: string; nome: string; gmv30dCents: number } | null;
}

export interface PlatformStoreListItem extends PlatformStore {
  merchantName?: string;
  orders30d?: number;
  gmv30dCents?: number;
  health: 'healthy' | 'attention' | 'suspended';
  logoUrl?: string | null;
}
```

**Nota performance P2:** agregação cross-tenant pode exigir cache (Redis) ou job noturno — documentar em P1 com KPIs baratos (só master DB).

---

## 10. Fases de implementação

| Fase | ID | Escopo | DoD resumido |
|------|-----|--------|--------------|
| **P0** | `shell-p0` | Spec + tokens `--shell-*` + wireframes ASCII | Este doc `approved` |
| **P1** | `shell-p1` | `AppShell`, `AppHeader`, `AppSidebar`, nav agrupada, Platform Dashboard básico, Stores grid+toolbar, KPI master-only | E2E smoke platform; testids |
| **P2** | `shell-p2` | Admin migrado para `AppShell`; Dashboard lojista `KpiStrip`; API stores paginada | E2E admin smoke verde |
| **P3** | `shell-p3` | Command palette; notificações; merchants list; filtros server-side | ⌘K funcional |
| **P4** | `shell-p4` | Store detail tabs; billing; health; analytics | Platform completo MVP+ |

**Ordem recomendada:** P1 Platform (dor maior) → P2 Admin → P3/P4.

**Paralelização:** P1 UI shell + API `dashboard/stats` (master-only) em paralelo.

---

## 11. Testes automatizados

| testid | Onde |
|--------|------|
| `app-shell` | Layout root |
| `app-header` | Header |
| `app-sidebar-nav` | Nav (substituir/alias `platform-sidebar-nav`, `admin-sidebar-nav`) |
| `command-palette` | Dialog busca |
| `kpi-strip` | Dashboard platform + admin |
| `platform-dashboard-page` | `/platform/dashboard` |
| `platform-stores-toolbar` | Busca/filtro/toggle |
| `platform-store-card-{slug}` | Grid card |
| `pagination-bar` | Listagens |
| `user-menu-trigger` | Avatar menu |
| `nav-group-{id}` | Grupos sidebar |

Atualizar [`docs/migration/test-ids-catalog.md`](../migration/test-ids-catalog.md) e `packages/test-utils/src/test-ids/`.

**E2E mínimo P1:**

- Platform admin login → dashboard KPIs visíveis → navega Lojas → grid cards → abre detalhe.
- Toggle grid/lista persiste na sessão (localStorage).
- Tema alterna pelo header.

---

## 12. Critérios de aceite (DoD global)

- [ ] Platform abre em `/platform/dashboard` (não só lista).
- [ ] Sidebar platform ≥ 4 itens úteis agrupados; admin reorganizado em ≥ 3 grupos.
- [ ] Header desktop visível em **ambas** personas com breadcrumbs e toggle tema.
- [ ] Lista de lojas platform em **grid de cards** com busca e paginação.
- [ ] Faixa KPI unificada no dashboard platform (mín. 4 métricas master DB).
- [ ] `LayoutAdmin` deprecated com alias para `AppShell` (sem quebrar imports).
- [ ] Mobile: touch 48px; toolbar empilha verticalmente.
- [ ] `pnpm turbo typecheck` + `make test-api` + E2E smoke verdes.
- [ ] Zero regressão impersonation banner e merchant hub.

---

## 13. Fora de escopo

- Redesign login (`/login`, `/platform/login`).
- Billing Asaas completo no platform (spec separada).
- Notificações push / e-mail digest.
- Custom widgets drag-and-drop (“Customize Widget” da referência).
- Ratings/reviews agregados (não temos domínio ainda).
- Replicar verde exato da referência — seguir tokens Ata Labs.

---

## 14. Referências de código atual

| Arquivo | Papel |
|---------|-------|
| `packages/ui/src/layout-admin.tsx` | Shell atual — evoluir |
| `packages/ui/src/sidebar.tsx` | `SidebarPanel` — base do `AppSidebar` |
| `apps/admin/src/routes/platform/layout.tsx` | Layout platform |
| `apps/admin/src/routes/admin/layout.tsx` | Layout admin |
| `apps/admin/src/routes/platform/stores/index.tsx` | Lista rows — substituir |
| `apps/admin/src/routes/admin/dashboard.tsx` | KPIs fragmentados |
| `apps/admin/src/lib/admin-nav-items.ts` | Nav flat — expandir |
| `apps/api/src/modules/platform/platform.service.ts` | API stores — estender |

---

## 15. Wireframe ASCII (Platform Dashboard alvo)

```
┌──────────┬─────────────────────────────────────────────────────────────┐
│ Ata Labs │ ← Platform / Dashboard          [?] [🌙] [👤 Peter ▾]      │
│ [🔍 ⌘K ] ├─────────────────────────────────────────────────────────────┤
│          │ ┌─────────────────────────────────────────────────────────┐ │
│ PRINCIPAL│ │ 128      78       50       84       44                  │ │
│ • Dash   │ │ Total   Ativas  Susp.   Trial   Novas30                 │ │
│ • Lojas  │ │ ─────────────────────────────────────────────────────── │ │
│ ANALYTICS│ │ R$2.5M   988k    +12.8%   —        Loja X               │ │
│ SUPORTE  │ │ GMV30d  Pedidos  Cresc.  Rating   Top                     │ │
│          │ └─────────────────────────────────────────────────────────┘ │
│ [👤 ▾]   │ [🔍 Buscar loja…] [Filtro] [⊞⊟]            [+ Nova loja]  │
│          │ ┌────────────┐ ┌────────────┐ ┌────────────┐               │
│          │ │ Store Card │ │ Store Card │ │ Store Card │  …            │
│          │ └────────────┘ └────────────┘ └────────────┘               │
│          │ ◀ 1 2 3 … ▶                    Showing 1–20 of 128          │
└──────────┴─────────────────────────────────────────────────────────────┘
```

---

## Changelog

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.0 | 2026-07-02 | Spec inicial — diagnóstico, shell reutilizável, platform dashboard/lojas, fases P0–P4 |
