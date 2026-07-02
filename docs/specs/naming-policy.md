# Política de nomenclatura — Ata Labs / Ata Commerce

| Campo | Valor |
|-------|-------|
| **Initiative ID** | `naming-policy` |
| **Spec version** | 1.0 |
| **Última atualização** | 2026-07-01 |
| **Status** | `active` |

---

## 1. Regra geral

**Proibido** usar o codinome legado **“Lojão” / `lojao`** em:

- Textos de produto (UI, marketing, e-mails, docs novas)
- Exemplos de código, comentários, seeds, fixtures
- Nomes de bancos/slugs **novos** em provisionamento
- Commits, specs e runbooks escritos a partir desta data

### Nomes oficiais

| Conceito | Nome | Uso |
|----------|------|-----|
| Empresa | **Ata Labs** | Landing, plataforma, contratos, suporte |
| Produto SaaS | **Ata Commerce** | Painel lojista, vitrine, checkout, docs de produto |
| Slug técnico curto | `atacommerce`, `commerce` | Bancos, buckets, identificadores internos **novos** |
| Domínio | `atalabs.com.br`, `app.atalabs.com.br` | Produção |

### Substituir

| Evitar | Preferir |
|--------|----------|
| Lojão | Ata Commerce |
| lojao (exemplo de loja) | `demo`, `minhaloja`, `acme` |
| `lojao_<slug>` (banco novo) | `atacommerce_<merchant_slug>` (ver [merchant-account-architecture-spec.md](./merchant-account-architecture-spec.md)) |
| admin@loja.com (exemplo) | `admin@example.com` ou `lojista@minhaempresa.com.br` |
| tenant slug `loja` em docs novas | `demo` |

---

## 2. Allowlist legada (não renomear até initiative dedicada)

Itens **estruturais** que quebram produção ou exigem migração coordenada:

| Item | Motivo | Initiative de remoção |
|------|--------|------------------------|
| Escopo npm `@lojao/*` | Monorepo, imports, CI | `rename-packages` (futuro) |
| Cookie de sessão `lojao.sid` | Sessões ativas, compatibilidade | MA4+ ou cookie v2 com dual-read |
| Serviços Render `lojao-api`, `lojao-admin`, `lojao-storefront`, `lojao-db` | Blueprint, DNS, env vars | Render rename + deploy |
| `DATABASE_URL` apontando para DB `lojao` **existente** | Dados em produção | [MA — merchant DB](./merchant-account-architecture-spec.md) |
| `POSTGRES_DB=lojao` em `docker-compose*.yml` | Volume Docker local dev | MA + compose v2 |
| Tabela master `tenants` | Schema legado (1 linha = 1 loja) | MA1–MA8 |
| Repo / paths históricos (`loja2`, migration docs) | Histórico; não expandir | Limpeza gradual |

> **Regra para agentes:** ao tocar código legado da allowlist, **não** propagar o nome em strings novas; comentar `// legacy: lojao — ver naming-policy.md`.

---

## 3. Banco de dados (MA greenfield)

A partir da initiative **Merchant Account**, **todo schema novo** é em **inglês**:

- Tabelas, colunas, keys de config, valores de status persistidos
- Convenções: `snake_case`, tabelas no plural, timestamps `created_at` / `updated_at`
- **Proibido** criar tabelas/colunas novas em português (`produtos`, `nome`, `ativo`, …)

**UI e textos de produto** permanecem **pt-BR**. Tradução na camada app, não no Postgres.

Catálogo e mapeamento legado → EN: **[db-schema-english.md](./db-schema-english.md)**.

O baseline legado (`0000_baseline.sql`, Drizzle `schema/tenant` PT) **não é renomeado** — é descartado no cutover MA8.

---

## 4. Checklist em PRs / sessões

- [ ] UI: zero “Lojão” visível ao usuário
- [ ] Docs/specs novas: Ata Commerce / Ata Labs
- [ ] Exemplos: slugs e e-mails genéricos, não `lojao`/`loja`
- [ ] Seeds de dev: tenant demo `demo`, não `loja` (quando MA permitir)
- [ ] Bancos novos: prefixo `atacommerce_`, não `lojao_`
- [ ] Schema MA: tabelas/colunas **só em inglês** (ver db-schema-english.md)

---

## 5. Referências

- Spec mestre (marca): [ata-labs-platform-spec.md](./ata-labs-platform-spec.md) §1.1 — **atualizar** codinome “manter Lojão” → substituído por esta política
- Arquitetura alvo contas: [merchant-account-architecture-spec.md](./merchant-account-architecture-spec.md)
- Schema PostgreSQL EN: [db-schema-english.md](./db-schema-english.md)
