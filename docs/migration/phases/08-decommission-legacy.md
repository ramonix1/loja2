# Fase 8 — Descomissionar legacy (Express + EJS)

| Campo | Valor |
|-------|-------|
| **ID** | `phase-8` |
| **Depende de** | Fases 3, 4, 6, 7 `done` |
| **Duração estimada** | 1–2 semanas |
| **Deploy** | [DEPLOY.md § Fase 8](../DEPLOY.md#fase-8--descomissionar-legacy) |

---

## Objetivo

Remover completamente `apps/legacy` e dependências Express/EJS. Produção roda apenas **api + admin + storefront + postgres + proxy**.

---

## Pré-requisitos (gate)

Antes de iniciar, confirmar em STATUS.md:

- [ ] Fase 3 `done` — zero admin EJS
- [ ] Fase 4 `done` — checkout/webhooks/chat na API
- [ ] Fase 6 `done` — zero vitrine/comprador EJS
- [ ] Fase 7 `done` — migrations formais
- [ ] Smoke test completo documentado e passando

---

## Escopo

### IN

- [ ] Remover `apps/legacy/` inteiro
- [ ] Remover `docker/Dockerfile.legacy`
- [ ] Remover serviço `legacy` do docker-compose
- [ ] Atualizar Makefile para estado final (DEPLOY.md)
- [ ] Storefront Next na porta principal (3000 ou via proxy 80)
- [ ] Admin: build estático servido por Caddy ou `@fastify/static` na API
- [ ] Migrar `/_tenants` dev tool para api ou script CLI (ou remover se obsoleto)
- [ ] Consolidar `scripts/` úteis em `packages/db` ou `apps/api/scripts`
- [ ] Atualizar `LEIA-ME.md` completo
- [ ] Atualizar `package.json` root — remover deps legacy
- [ ] CI: `pnpm turbo test build typecheck`

### OUT

- Manter código morto "por precaução"
- Dual-run express

---

## docker-compose final

Ver DEPLOY.md diagrama. Serviços mínimos:

- `api`
- `storefront`
- `admin` (build static ou dev)
- `proxy` (Caddy/nginx)
- `db`

---

## Rotas finais (proxy)

| Path | Serviço |
|------|---------|
| `/api/*` | api:3001 |
| `/webhook/*` | api:3001 |
| `/admin/*` | admin static |
| `/*` | storefront:3000 |

Socket.io: mesmo domínio, path `/socket.io` → api

---

## Critérios de aceite (DoD)

- [ ] `apps/legacy` não existe no repo
- [ ] `grep -r "express" package.json` — só se dependência transitiva inexistente
- [ ] `make up` sobe stack final sem legacy
- [ ] Login admin + comprador + checkout teste + webhook test passam
- [ ] `LEIA-ME.md` reflete nova arquitetura
- [ ] `.env.example` limpo
- [ ] STATUS.md: Fase 8 → `done`; métricas legacy = 0
- [ ] Tag release sugerida: `v2.0.0-monorepo`

---

## Testes automatizados — como implementar

### Escopo final CI

| Comando | Conteúdo |
|---------|----------|
| `make test-all` ou `pnpm test:all` | api unit+integration + e2e @smoke |
| `pnpm test:legacy` | **Removido** do gate (legacy não existe) |

### Entregáveis

1. **GitHub Actions / CI** (ou documentar equivalente):

```yaml
- run: pnpm install
- run: pnpm turbo typecheck
- run: pnpm --filter api test
- run: pnpm exec playwright install --with-deps chromium
- run: make up-d && pnpm test:e2e:smoke
```

2. **`apps/e2e/README.md`** — guia completo para testador (env, seed, tags @smoke)

3. **Remover** specs/examples que referenciem legacy URLs `:3000` EJS admin

### Regressão obrigatória pré-release

```bash
pnpm test:all
```

Testador valida suite completa (não só @smoke) antes de tag `v2.0.0-monorepo`.

### Legacy

- Jest legacy **removido** com `apps/legacy`
- Histórico em tag git `legacy/final` — **sem** E2E legacy

---

## Verificação final (smoke)

```bash
make deploy-check    # test + typecheck + build
make up-d
# 1. Abrir vitrine, ver produtos
# 2. Login comprador, checkout teste
# 3. Login admin, ver pedido criado
# 4. Webhook stripe CLI trigger (opcional)
```

---

## Documentação final

Criar `docs/ARCHITECTURE.md` resumindo stack pós-migração:
- Diagrama apps
- Fluxo tenant
- Deploy produção
- Onboarding dev

---

## Rollback plan

Manter branch `legacy/final` ou tag git pré-remoção por 30 dias. Não deploy rollback automático.
