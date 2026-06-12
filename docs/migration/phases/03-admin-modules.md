# Fase 3 — Migrar admin completo (EJS → React)

| Campo | Valor |
|-------|-------|
| **ID** | `phase-3` |
| **Depende de** | Fase 2 `done` |
| **Duração estimada** | 6–8 semanas |
| **Deploy** | [DEPLOY.md § Fase 3](../DEPLOY.md#fase-3--admin-completo) |

---

## Objetivo

Substituir **todas** as páginas `admin-*.ejs` por telas React equivalentes. Legacy deixa de servir UI admin; redireciona para admin app.

---

## Escopo

### IN

Migrar módulos na ordem abaixo. Cada módulo = endpoints API + telas React + redirect legacy.

| Ordem | Módulo | EJS legacy | Rotas React | Prioridade API |
|-------|--------|------------|-------------|----------------|
| 1 | Categorias | admin-categorias, admin-categoria-editar | /admin/categorias | CRUD |
| 2 | Banners | admin-banners, admin-banner-form | /admin/banners | CRUD + upload |
| 3 | Aparência | admin-aparencia | /admin/aparencia | GET/PUT config |
| 4 | Produtos | admin, editar | /admin/produtos, /admin/produtos/:id | CRUD + imagens |
| 5 | Compradores | admin-compradores, admin-comprador-detalhe, admin-clientes | /admin/compradores | list + detail |
| 6 | Configurações | admin-configuracoes | /admin/configuracoes | pagamentos, frete, email |
| 7 | Relatórios | admin-relatorios | /admin/relatorios | agregações + CSV download |
| 8 | Agenda | admin-agenda | /admin/agenda | config + dias |
| 9 | Permissões | admin-permissoes | /admin/permissoes | CRUD admins |
| 10 | Chat | admin-chat | /admin/chat | REST + socket client |
| 11 | Diagnóstico | admin-diagnostico | /admin/diagnostico | health integrações |
| 12 | Pedidos detalhe | admin-pedido-detalhe | /admin/pedidos/:id | GET + PATCH status |

**Também migrar (se ainda EJS):**
- [x] `admin-dashboard.ejs` — expandir Fase 2 (cards + pedidos recentes — **done**)
- [x] `admin-pedidos.ejs` — expandir com filtros/ações (status via API — **done**; checkout completo Fase 4)

**Melhoria pós-paridade (módulo 13 — ver seção abaixo):**
- [ ] Dashboard — gráficos **Recharts** para visão analítica (receita, status, pagamentos, top produtos)

### Por módulo entregar

1. Endpoints REST em `apps/api/src/modules/<modulo>/`
2. Zod schemas em `packages/types`
3. Telas React + formulários
4. Testes API do módulo
5. Legacy route → redirect 302 para URL React equivalente
6. Remover EJS do módulo
7. **`data-testid`** em ações, inputs e tabela/form do módulo + entrada em [test-ids-catalog.md](../test-ids-catalog.md)

### OUT

- Checkout/carrinho API (Fase 4)
- Vitrine Next (Fase 5)
- Build produção admin (pode ser Fase 3 final ou Fase 8)
- **Testes E2E / testid no EJS legacy**

---

## Testes automatizados — como implementar

### Regra por módulo migrado

Cada linha da tabela de módulos exige **antes de marcar módulo done**:

| # | Entrega teste | Responsável |
|---|---------------|-------------|
| 1 | Constantes `packages/test-utils/src/test-ids/admin-{modulo}.ts` | Dev front |
| 2 | `data-testid` em list, form, submit, delete, empty, error | Dev front |
| 3 | Linhas em [test-ids-catalog.md](../test-ids-catalog.md) | Dev front |
| 4 | `apps/api/tests/integration/admin.{modulo}.test.ts` (CRUD happy path + 403) | Dev back |
| 5 | Playwright `apps/e2e/tests/admin/{modulo}.spec.ts` **ou** casos em spec existente | Dev front (mínimo); QA expande |

### Padrão de testids por módulo

Prefixo: `admin-{modulo}-*`

| Elemento | Sufixo testid |
|----------|---------------|
| Tabela/lista | `{modulo}-table` |
| Botão novo | `{modulo}-create-btn` |
| Form submit | `{modulo}-form-submit-btn` |
| Botão excluir | `{modulo}-delete-btn` |
| Input nome (ex.) | `{modulo}-nome-input` |
| Empty state | `{modulo}-empty-state` |

Exemplo produtos: `admin-produtos-table`, `admin-produtos-create-btn`, `admin-produtos-row-{id}`.

### Specs Playwright — mínimo por módulo

Cada `{modulo}.spec.ts` deve ter **pelo menos**:

```typescript
test('admin {modulo} listagem @smoke', async ({ page }) => {
  await page.goto('/admin/{modulo}');
  await expect(page.getByTestId('admin-{modulo}-table')).toBeVisible();
});
```

Módulos com form (categorias, banners, produtos): adicionar teste `criar registro` usando método **teste** ou seed API.

### Módulos prioritários para QA (expandir suite)

1. Produtos (CRUD + upload)
2. Pedidos detalhe (status)
3. Configurações (pagamentos)

Chat (socket): spec pode assertir apenas `admin-chat-panel` visible + enviar mensagem com testid `admin-chat-input` / `admin-chat-send-btn`.

### Legacy

- Redirect 302 apenas — **sem** data-testid nos EJS remanescentes
- Testes Jest legacy **não** precisam cobrir redirects

### Comandos

```bash
pnpm --filter api test
pnpm test:e2e -- tests/admin/
```

### Pronto para o testador

- Catálogo testids admin completo
- Suite `tests/admin/*.spec.ts` executável com `pnpm test:e2e`
- QA adiciona edge cases, negative paths, CSV download, etc.

---

## Padrões obrigatórios

### Upload (banners, produtos)

- `@fastify/multipart` na API
- Salvar em `public/uploads/` ou volume compartilhado (mesmo path legacy)
- URLs retornadas compatíveis com legacy

### Tabelas admin

- Componente `DataTable` em `packages/ui` com paginação, sort, filtros
- Usar TanStack Table se necessário

### Formulários

- React Hook Form + Zod resolver
- Toast/alert para sucesso e erro

---

## Redirects legacy (exemplo)

Em `apps/legacy/routes/*Routes.js`:

```javascript
router.get('/admin/categorias', requireAdmin, (req, res) => {
  res.redirect(302, process.env.ADMIN_URL + '/admin/categorias');
});
```

Env `ADMIN_URL=http://localhost:5173` (dev)

---

## Critérios de aceite (DoD)

- [ ] Zero arquivos `views/pages/admin-*.ejs` restantes (deletados ou stub redirect)
- [ ] Todas rotas `/admin/*` funcionam no React app
- [ ] Paridade funcional com legacy validada (checklist manual por módulo)
- [ ] Upload imagens produto/banner funciona
- [ ] Relatório CSV exporta corretamente
- [ ] Chat admin conecta (socket pode ainda apontar legacy até Fase 4 — documentar)
- [ ] `make test` legacy passa (rotas restantes non-admin)
- [ ] OpenAPI atualizado com todos endpoints admin
- [ ] **100% módulos admin** com `data-testid` nos elementos assertáveis
- [ ] Catálogo test-ids completo para admin
- [ ] (QA) Suite Playwright admin expandida (CRUD smoke por módulo prioritário)
- [ ] STATUS.md: Fase 3 → `done`; métricas EJS admin = 0

---

## Checklist paridade manual (por módulo)

```
[ ] Listar
[ ] Criar
[ ] Editar
[ ] Excluir (se aplicável)
[ ] Validações de campo
[ ] Permissão admin-only
[ ] Mensagens de erro em pt-BR
```

---

## Verificação

```bash
pnpm --filter admin build   # deve compilar sem erro TS
pnpm --filter api test
# Percorrer sidebar inteira no browser
grep -r "admin-" apps/legacy/views/pages/  # esperado: vazio ou só redirects
```

---

## Handoff Fase 4 / 5

- Lista endpoints ainda servidos só pelo legacy
- Chat/socket: estado da migração
- Admin build estático pronto ou pendente
- **Opcional antes da Fase 5:** módulo 13 — dashboard com gráficos Recharts (spec abaixo)

---

## Melhoria — Dashboard — gráficos Recharts

| Campo | Valor |
|-------|-------|
| **ID** | `phase-3-mod-13` |
| **Depende de** | Fase 3 core `done` (dashboard expand) |
| **Bloqueia Fase 5?** | Não — melhoria UX admin independente |
| **Duração estimada** | 3–5 dias |
| **Prioridade** | Alta para experiência do lojista; executar **antes ou em paralelo** à Fase 5 |

### Objetivo

Transformar o `/admin/dashboard` de uma tela só com **cards numéricos** em um **painel analítico** que responda, de forma visual e imediata:

- Como está a receita nos últimos dias?
- Quantos pedidos estão em cada etapa do funil?
- Quais formas de pagamento o cliente usa mais?
- Quais produtos vendem mais?

Usar **[Recharts](https://recharts.org/)** no `apps/admin`, alinhado ao tema escuro do painel e aos tokens/cores já usados nos badges de status.

### Por que Fase 3 (e não Relatórios ou Fase 5)

| Opção | Motivo |
|-------|--------|
| **Fase 3 (escolhida)** | Dashboard já é React; é a **primeira tela** do lojista após login — impacto máximo na clareza operacional |
| Relatórios | Página de export CSV e tabelas detalhadas; gráficos no dashboard são **resumo executivo**, não substituem relatórios |
| Fase 5 (vitrine) | Escopo público/comprador; dashboard é **admin-only** |

### Escopo

#### IN

- [ ] Dependência `recharts` em `apps/admin` (`pnpm add recharts --filter admin`)
- [ ] API `GET /api/v1/admin/dashboard/charts?periodo=7d|30d|90d` (default `30d`)
- [ ] Reutilizar lógica de agregação já existente em `relatorios.service.ts` (`getDadosVendas`, `getDadosFinanceiro`, `getDadosProdutos`) — **extrair helpers compartilhados** em `apps/api/src/modules/admin/dashboard-charts.service.ts` (evitar duplicar SQL)
- [ ] Tipos Zod + export em `@lojao/types/dashboard`
- [ ] Componentes em `apps/admin/src/routes/admin/dashboard/`:
  - `dashboard-charts.tsx` — grid responsivo
  - `revenue-chart.tsx` — `AreaChart` receita confirmada por dia
  - `orders-by-status-chart.tsx` — `PieChart` ou `BarChart` horizontal
  - `payment-methods-chart.tsx` — `BarChart` receita por método
  - `top-products-chart.tsx` — `BarChart` horizontal top 5 por quantidade
- [ ] Layout proposto (mobile-first):

```
┌─────────────────────────────────────────────────────────┐
│ KPI cards (manter os atuais — receita, pedidos, etc.)   │
├──────────────────────────────┬──────────────────────────┤
│ Receita — últimos N dias     │ Pedidos por status       │
│ (AreaChart, ~2/3 largura)    │ (PieChart, ~1/3)         │
├──────────────────────────────┼──────────────────────────┤
│ Formas de pagamento          │ Top 5 produtos           │
│ (BarChart)                   │ (BarChart horizontal)    │
├──────────────────────────────┴──────────────────────────┤
│ Pedidos recentes (tabela existente)                     │
└─────────────────────────────────────────────────────────┘
```

- [ ] Seletor de período (`7d` / `30d` / `90d`) no topo da seção de gráficos
- [ ] Estados: loading (skeleton), empty (`admin-dashboard-chart-empty`), erro
- [ ] Formatação pt-BR: `Intl.NumberFormat` para BRL, datas `toLocaleDateString('pt-BR')`
- [ ] Tooltip Recharts customizado (fundo escuro, texto legível)
- [ ] **`data-testid`** conforme [test-ids-catalog.md](../test-ids-catalog.md)
- [ ] OpenAPI atualizado
- [ ] Seed dev (`make seed`) documentado como forma de popular gráficos localmente

#### OUT

- Gráficos na página `/admin/relatorios` (permanece tabelas + CSV)
- Bibliotecas alternativas (Chart.js, Nivo, etc.)
- Drill-down clicável para filtros em `/admin/pedidos` (nice-to-have futuro)
- Gráficos na vitrine ou área do comprador

### API — contrato

#### GET /api/v1/admin/dashboard/charts

Auth: admin. Query: `periodo` = `7d` | `30d` | `90d` (default `30d`).

Response:

```json
{
  "data": {
    "periodo": "30d",
    "receita_por_dia": [
      { "dia": "2026-05-12", "receita": 150.0, "pedidos": 2 }
    ],
    "pedidos_por_status": [
      { "status": "pago", "total": 12 },
      { "status": "aguardando_pagamento", "total": 3 }
    ],
    "receita_por_metodo": [
      { "metodo": "pix", "receita": 800.0, "pedidos": 5 }
    ],
    "top_produtos": [
      { "nome": "Garrafa Térmica", "quantidade": 24, "receita": 720.0 }
    ]
  }
}
```

**Regras de negócio (alinhadas a Relatórios):**

- Receita confirmada: pedidos com `status NOT IN ('cancelado', 'aguardando_pagamento')`
- `pedidos_por_status`: contagem de **todos** os pedidos no período (inclui cancelados — cor distinta no gráfico)
- `top_produtos`: agregar `pedido_itens` no período, limit 5
- Timezone: `America/Sao_Paulo` ou `CURRENT_DATE` do Postgres (documentar escolha)

Manter `GET /admin/dashboard/stats` **inalterado** (KPIs + pedidos recentes) — segunda query TanStack Query para charts.

### UI — Recharts

```bash
pnpm add recharts --filter admin
```

Padrões:

- `ResponsiveContainer` width="100%" height={280}
- Cores fixas por status (reutilizar mapa de `dashboard.tsx` `STATUS_STYLES`)
- Eixo Y receita: tickFormatter com BRL compacto (ex.: `R$ 1,2k`)
- `prefers-reduced-motion`: desabilitar animação (`isAnimationActive={false}`) quando `matchMedia('(prefers-reduced-motion: reduce)')`

Componente opcional em `packages/ui/chart-card.tsx` — wrapper `Card` + título + children (Recharts fica no admin, não acoplar lib ao package ui).

### data-testid (módulo 13)

| testid | Elemento |
|--------|----------|
| `admin-dashboard-charts` | Container da seção de gráficos |
| `admin-dashboard-chart-revenue` | Gráfico receita |
| `admin-dashboard-chart-status` | Gráfico status |
| `admin-dashboard-chart-payment` | Gráfico pagamento |
| `admin-dashboard-chart-top-products` | Gráfico top produtos |
| `admin-dashboard-chart-period-{7d\|30d\|90d}` | Botões de período |
| `admin-dashboard-chart-empty` | Empty state global ou por gráfico |

Constantes: estender `packages/test-utils/src/test-ids/admin.ts`.

### Testes automatizados — como implementar

| Tipo | Ação |
|------|------|
| API | `apps/api/tests/integration/admin.dashboard-charts.test.ts` — 200 admin, 401/403, periodo inválido 400, shape JSON |
| Playwright | Expandir `apps/e2e/tests/admin/dashboard.spec.ts` — após login, `make seed`, assertir `admin-dashboard-charts` + `admin-dashboard-chart-revenue` visible |
| Seed | Rodar `make seed` no README E2E — gráficos devem exibir dados com seed `[DEV]` |

Casos API mínimos:

```typescript
test('GET charts 30d como admin', async () => { /* 200, arrays não vazios com seed */ });
test('GET charts periodo invalido', async () => { /* 400 */ });
test('GET charts sem auth', async () => { /* 401 */ });
```

### Critérios de aceite (DoD)

- [ ] Dashboard exibe 4 gráficos Recharts responsivos abaixo dos KPI cards
- [ ] Seletor de período recarrega dados sem reload da página
- [ ] Empty state quando tenant sem pedidos no período
- [ ] Gráficos legíveis no tema escuro (contraste WCAG AA nos textos do tooltip)
- [ ] `pnpm --filter admin build` sem erro TS
- [ ] `pnpm --filter api test` — novos casos passando
- [ ] Playwright dashboard @smoke passa com seed
- [ ] OpenAPI + test-ids-catalog atualizados
- [ ] STATUS.md: módulo 13 → `done`

### Verificação

```bash
make up-full-d
make seed
pnpm --filter admin dev
# Browser: /admin/dashboard — gráficos com dados [DEV]
pnpm --filter api test -- admin.dashboard-charts
pnpm test:e2e -- tests/admin/dashboard.spec.ts
```

### Handoff

- Padrão Recharts estabelecido para reuso futuro (ex.: mini-gráfico em Relatórios, se solicitado)
- Helpers SQL compartilhados entre dashboard charts e relatórios documentados em comentário no service

