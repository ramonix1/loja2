# Prompts — fases restantes (copy-paste)

Use **um prompt por sessão** no Cursor Agent. Ordem recomendada:

| # | Fase | Arquivo | Estimativa |
|---|------|---------|------------|
| 1 | **H** — Merchant Hub | [ata-h-merchant-hub.md](./ata-h-merchant-hub.md) | 2–3 dias |
| 2 | **C** — Branding admin | [ata-c-branding.md](./ata-c-branding.md) | 1 dia |
| 3 | **G** — API self-service | [ata-g-self-service-api.md](./ata-g-self-service-api.md) | 3–5 dias |
| 4 | **M7** — UI signup | [store-m7-signup-ui.md](./store-m7-signup-ui.md) | 2–3 dias |

## Como usar

1. Abra o prompt da fase.
2. Copie o bloco **「Prompt para o agente」** inteiro para um chat novo (Agent mode).
3. Ao concluir, o agente deve atualizar `docs/specs/STATUS.md` (+ `storefront-marketing-STATUS.md` se M7).

## Specs de referência (detalhe)

| Fase | Spec |
|------|------|
| H | [admin-merchant-hub-spec.md](../admin-merchant-hub-spec.md) |
| C | [ata-labs-platform-spec.md § Fase C](../ata-labs-platform-spec.md#fase-c--branding-ata-labs--ata-commerce) |
| G | [storefront-onboarding-spec.md §6](../storefront-onboarding-spec.md#6-api--fase-g-platform) |
| M7 | [storefront-onboarding-spec.md](../storefront-onboarding-spec.md) |

## Onde ficam os MDs (vault vs repo)

**Configurado em 2026-06-22** para este ambiente:

| Caminho Windows (Obsidian) | Caminho WSL |
|----------------------------|-------------|
| `C:\Users\barbo\OneDrive\Documentos\Obsidian-Atos\Ata Tech\Ata Commerce\loja2\specs\` | `/mnt/c/Users/barbo/OneDrive/Documentos/Obsidian-Atos/Ata Tech/Ata Commerce/loja2/specs/` |

- **Editar specs no Obsidian** → mudanças refletem no Cursor (mesmo arquivo via symlink).
- **No git do loja2:** só `STATUS.md`, `prompts/`, este README.
- **Recriar links:** `./scripts/setup-obsidian-vault.sh`

### Cuidados WSL + OneDrive

- I/O em `/mnt/c/` é mais lento que disco Linux nativo — ok para markdown, evite build/cache no OneDrive.
- OneDrive pode demorar a sincronizar; espere sync antes de commitar no vault (git do Obsidian).
- Dois gits separados: vault Obsidian (`.git` na raiz Atos) ≠ repo `loja2`.

---

## Estratégia de documentação (referência)

### O problema

Hoje existem **dois layers** de docs:

- `docs/migration/` — migração Lojão → monorepo (Fase 8 **done**; histórico)
- `docs/specs/` — initiative Ata Labs pós-migração (C, G, H, M7 pendentes)

Isso é normal em projetos spec-driven, mas **não precisa** ficar todo dentro do git do app.

### Regra prática: 3 tiers

| Tier | Onde | Conteúdo | Motivo |
|------|------|----------|--------|
| **A — Repo (obrigatório)** | `AGENTS.md`, `.cursor/rules/`, `LEIA-ME.md`, `docs/migration/DEPLOY.md`, `docs/migration/test-ids-catalog.md`, `docs/specs/STATUS.md` | O que agente + CI + deploy precisam | Cursor lê automaticamente |
| **B — Repo (enxuto)** | `docs/specs/prompts/` + 1 spec ativa por vez (opcional) | Prompts e spec da fase **em andamento** | Copy-paste rápido |
| **C — Vault Obsidian (fora ou symlink)** | Specs longas, logs, brainstorm, PDFs, protótipos HTML | “Segundo cérebro” pessoal/equipe | Não polui diff do código |

### O que fazer com os MDs atuais

**Opção recomendada (híbrida):**

1. Crie um vault Obsidian, ex.: `~/Documents/AtaLabs-vault/`
2. **Mova** (ou copie) para lá:
   - `docs/specs/*.md` (exceto `STATUS.md` se quiser manter no repo)
   - `docs/migration/phases/`, `CONTEXT.md`, logs históricos
   - `atalabs-landing/` (protótipos + PDF identidade)
3. No repo, deixe **ponteiros finos**:
   - `docs/specs/STATUS.md` — única fonte de progresso
   - `docs/specs/prompts/` — prompts (este folder)
   - `docs/README.md` — 10 linhas: “specs completas no vault Obsidian em …”
4. Arquive migração: pasta `docs/migration/` pode ir inteira pro vault; manter só `DEPLOY.md` + `test-ids-catalog.md` no repo.

**Não delete** `docs/migration/` até confirmar que ninguém mais consulta — marque como `ARCHIVED` no README.

### Obsidian + Cursor — dá para conectar?

**Sim**, com expectativa correta:

| Objetivo Obsidian | Ajuda? |
|-------------------|--------|
| Notas pessoais, links, MOCs, decisões | ✅ Excelente |
| Substituir specs que o agente precisa ler | ⚠️ Só se o vault estiver **no workspace** do Cursor |
| Reduzir MDs no repo | ✅ Vault separado + STATUS slim no repo |

**Setup simples (WSL):**

```bash
# 1. Vault Obsidian (fora do repo)
mkdir -p ~/Documents/AtaLabs-vault/specs

# 2. Mover specs (exemplo — faça backup antes)
# mv docs/specs/*.md ~/Documents/AtaLabs-vault/specs/

# 3. Symlink opcional — vault visível no repo sem duplicar conteúdo
# ln -s ~/Documents/AtaLabs-vault/specs docs/specs/vault
```

**Cursor:**

- *File → Add Folder to Workspace* → adicione `AtaLabs-vault` como segunda raiz.
- Ou abra só o vault quando for planejar; use o repo quando for implementar com o prompt + `STATUS.md`.

**Obsidian:**

- Abra a pasta `AtaLabs-vault` como vault.
- Use plugins úteis: **Dataview** (listar fases pending), **Templater** (prompts), **Git** (sync vault privado).

O “segundo cérebro” **não substitui** `STATUS.md` no repo — é onde você **pensa**; o repo guarda **o que está done** e **o que o agente executa**.

### Intuito real do Obsidian (resumido)

Não é mágica: é grafo de notas + busca + links. Vale a pena se você:

- revisita decisões (por que Merchant Hub antes de M7?);
- liga spec → protótipo → ticket;
- não quer 800 linhas de spec no `git diff` de uma PR de CSS.

Se você só usa specs como checklist para o agente, **prompts + STATUS no repo** bastam; o resto pode ir pro vault.
