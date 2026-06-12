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
- [ ] `admin-dashboard.ejs` — expandir Fase 2
- [ ] `admin-pedidos.ejs` — expandir com filtros/ações (status via API; checkout completo Fase 4)

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
