# Estratégia de testes automatizados

Documento para devs, agentes implementadores e **testador QA**. Define intenção, ferramentas, pirâmide de testes e uso de **`data-testid`** (seletores estáveis para E2E).

Relacionado: `TESTING.md` (Jest legacy), `docs/migration/runbooks/smoke-comprador.md`.

---

## Intenção do produto

O Lojão terá **testes automatizados** como parte da qualidade contínua:

| Camada | Objetivo |
|--------|----------|
| **API** | Garantir contratos, auth, tenant, checkout e webhooks |
| **UI (admin + vitrine)** | Garantir fluxos críticos do usuário (login, compra, gestão pedidos) |
| **E2E** | Validar sistema integrado multi-tenant antes de release |
| **Regressão** | Rodar no CI a cada PR |

A migração para React/Next é o ponto de instrumentação com **`data-testid`**. Legacy EJS **não** será instrumentado. Ver [TESTING-STRATEGY.md](./TESTING-STRATEGY.md) e [TESTING-IMPLEMENTATION.md](./TESTING-IMPLEMENTATION.md).

---

## Por que o testador pediu `data-test` / `data-testid`?

Ele provavelmente quer **seletores estáveis** para automação (Playwright, Cypress).

### O que são

Atributos HTML usados **somente pelos testes**, não pelo CSS nem pelo usuário:

```html
<button data-testid="checkout-submit-btn">Finalizar pedido</button>
```

No Playwright:

```typescript
await page.getByTestId('checkout-submit-btn').click();
```

### Por que não usar classe CSS ou `#id`?

| Seletor | Problema |
|---------|----------|
| `.btn-primary` | Muda com redesign Tailwind |
| `#submit` | IDs duplicados, refatoração quebra teste |
| `text=Finalizar` | Quebra com i18n ou copy |
| **`data-testid`** | Contrato explícito dev ↔ QA; estável |

### `data-test` vs `data-testid`

| Atributo | Uso |
|----------|-----|
| **`data-testid`** | **Padrão adotado no projeto** — suporte nativo Playwright (`getByTestId`) e Testing Library |
| `data-test` | Não é convenção ampla; evitar |

Se o testador disse "data-test", alinhar com ele que usamos **`data-testid`** (mesma finalidade, nomenclatura padrão da indústria).

### Precisa estar "em tudo"?

**Não.** Boas práticas:

- ✅ Botões, links e inputs de fluxos críticos
- ✅ Tabelas, linhas (`data-testid` por row com id dinâmico)
- ✅ Mensagens de erro/sucesso toast
- ✅ Estados vazios e loading
- ❌ Cada `<div>` decorativo
- ❌ Texto estático que não é assertado
- ❌ Backend / API JSON (usa endpoints e status HTTP)

Regra prática: **se o testador precisa clicar ou assertar, coloca `data-testid`.**

---

## Pirâmide de testes do Lojão

```
        ┌─────────┐
        │   E2E   │  Playwright — poucos, fluxos críticos
        ├─────────┤
        │ Integr. │  API supertest/vitest — módulos por fase
        ├─────────┤
        │  Unit   │  Services, Zod, utils — alta cobertura onde há lógica
        └─────────┘
```

| Tipo | Onde | Quem lidera | Quando |
|------|------|-------------|--------|
| Unit | `apps/api`, `packages/*` | Dev back | Cada fase API |
| Integration API | `apps/api/tests` | Dev back | Fase 1+ |
| Component | `packages/ui`, admin | Dev front | Fase 2+ (opcional) |
| E2E UI | `apps/e2e` ou `apps/storefront/e2e` | **Testador QA** | Fase 2+ (admin), Fase 6+ (checkout) |
| Legacy Jest | `apps/legacy/tests` | Devs | Até Fase 8 |

---

## Convenção `data-testid`

### Formato

```
{app}-{pagina}-{elemento}[-{variante}]
```

| Parte | Valores exemplo |
|-------|-----------------|
| app | `admin`, `store`, `auth` |
| pagina | `pedidos`, `checkout`, `login`, `produto` |
| elemento | `submit-btn`, `email-input`, `table`, `row`, `error-msg` |

### Exemplos

| Elemento | data-testid |
|----------|-------------|
| Botão login admin | `auth-login-submit-btn` |
| Input e-mail login | `auth-login-email-input` |
| Tabela pedidos admin | `admin-pedidos-table` |
| Linha pedido #42 | `admin-pedidos-row-42` |
| Botão finalizar checkout | `store-checkout-submit-btn` |
| Card produto na home | `store-home-product-card-{id}` |
| Toast sucesso | `ui-toast-success` |

### React — prop helper

Em `packages/ui`, expor prop que repassa test id:

```tsx
<Button data-testid="admin-pedidos-filter-btn">Filtrar</Button>
```

Opcional: helper `packages/test-utils/test-id.ts` com constantes exportadas para dev e QA compartilharem.

### Next.js

- Client Components interativos: `data-testid` direto
- Server Components: wrapper client ou `data-testid` no elemento HTML estático assertável

### Legacy EJS

- **Não** adicionar retroativamente em todas as 34 páginas
- Só se teste E2E ainda depender de EJS antes da migração da tela (exceção documentada)

---

## Responsabilidades do time

| Papel | Responsabilidade em testes |
|-------|----------------------------|
| **Dev front** | `data-testid` em telas React/Next; componentes testáveis em `packages/ui` |
| **Dev back** | Testes integração API; fixtures; seed de dados de teste |
| **Testador QA** | Playwright specs; catálogo de casos; revisar testids; CI e2e |
| **Agente IA** | Seguir spec da fase; incluir testids em UI nova; não remover testids existentes |

---

## Estrutura no monorepo (alvo)

```
apps/
  api/
    tests/
      integration/
  admin/
  storefront/
    e2e/                    # ou apps/e2e centralizado
packages/
  test-utils/
    src/
      test-ids.ts           # constantes compartilhadas (opcional)
      fixtures.ts           # usuários/tenant de teste
  test-fixtures/            # seed SQL ou factories (Fase 4+)
playwright.config.ts        # root ou apps/e2e
```

---

## Integração por fase da migração

| Fase | Testes | data-testid |
|------|--------|-------------|
| **0** | Legacy Jest continua; scaffold `packages/test-utils` vazio | — |
| **1** | Integration: auth, tenant, me | — |
| **2** | Admin: testids login, dashboard, pedidos; 1 spec Playwright smoke | **Obrigatório** em telas novas |
| **3** | Testids em **todo** módulo admin migrado; QA expande suite | **Obrigatório** por módulo |
| **4** | Integration checkout/webhooks ≥60%; API não usa testid | — |
| **5** | Testids vitrine pública (home, produto) | **Obrigatório** |
| **6** | E2E checkout completo; testids carrinho/checkout | **Obrigatório** + suite QA |
| **7** | Testes db/migrations | — |
| **8** | CI `make test-all` = unit + integration + e2e smoke | Catálogo testids congelado |

---

## Playwright (padrão E2E)

Escolha fechada: **Playwright** (multi-browser, trace, boa DX).

### Config mínima

- Base URL: `http://localhost:8080` (proxy) ou storefront
- Tenant dev: header `X-Tenant-Slug: loja` ou subdomínio
- Storage state: reutilizar login (setup project)
- Método pagamento `teste` para checkout E2E

### Specs prioritários (QA)

1. Admin login → dashboard
2. Admin lista pedidos
3. Comprador login → add cart → checkout teste → meus pedidos
4. (Opcional) Admin altera status pedido

### CI

```yaml
# pseudo — Fase 6+
- run: pnpm exec playwright install --with-deps
- run: make up-d && pnpm test:e2e
```

Documentar em `DEPLOY.md` quando entrar no Makefile: `make test-e2e`.

---

## Catálogo de testids (manutenção)

Arquivo vivo: **`docs/migration/test-ids-catalog.md`** — QA e devs registram ids ao criar telas.

Formato:

```markdown
## admin-pedidos
| testid | Elemento | Spec Playwright |
|--------|----------|---------------|
| admin-pedidos-table | Tabela | pedidos.spec.ts |
```

---

## O que NÃO fazer

- Usar `data-testid` para estilizar (`[data-testid] { color: red }`)
- Duplicar ids na mesma página
- Remover testid sem atualizar specs QA
- Testar webhooks reais de produção no E2E (usar modo teste/sandbox)
- Bloquear migração esperando 100% cobertura E2E no dia 1

---

## Critério de pronto (UI) — além do DoD da fase

Toda tela React/Next entregue em Fase 2+ deve ter:

- [ ] `data-testid` em ações primárias (submit, delete, save)
- [ ] `data-testid` em inputs de formulário principal
- [ ] `data-testid` em container assertável (table, empty-state, error-banner)
- [ ] Entrada no catálogo `test-ids-catalog.md`
- [ ] (Fase 6+) spec Playwright smoke se fluxo crítico

---

## Specs por fase (implementação detalhada)

Cada fase em `docs/migration/phases/` contém seção **「Testes automatizados — como implementar」** com:

- Casos de teste API (arquivo + assert)
- Lista exata de `data-testid`
- Specs Playwright a criar
- Comandos de verificação
- O que fica pronto para o testador QA

Consolidado em [TESTING-IMPLEMENTATION.md](./TESTING-IMPLEMENTATION.md).

---

- [Playwright — Locators](https://playwright.dev/docs/locators#locate-by-test-id)
- [Testing Library — priority](https://testing-library.com/docs/queries/about#priority)
- `TESTING.md` — Jest legacy
