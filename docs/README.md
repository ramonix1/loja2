# Documentação — Lojão / Ata Commerce

## No repositório (git)

| Arquivo | Uso |
|---------|-----|
| [specs/STATUS.md](./specs/STATUS.md) | Progresso fases platform — **agente atualiza aqui** |
| [specs/prompts/](./specs/prompts/) | Prompts copy-paste por fase |
| [migration/DEPLOY.md](./migration/DEPLOY.md) | Deploy Docker / Render |
| [migration/test-ids-catalog.md](./migration/test-ids-catalog.md) | Catálogo `data-testid` |
| [migration/TESTING-STRATEGY.md](./migration/TESTING-STRATEGY.md) | Estratégia de testes |

## No Obsidian (vault — fonte de verdade das specs)

**Windows:** `C:\Users\barbo\OneDrive\Documentos\Obsidian-Atos\Ata Tech\Ata Commerce\loja2`

**WSL:** `/mnt/c/Users/barbo/OneDrive/Documentos/Obsidian-Atos/Ata Tech/Ata Commerce/loja2`

Specs longas vivem em `loja2/specs/`. No repo, `docs/specs/*.md` (exceto STATUS e prompts) são **symlinks** locais para o vault.

Após clone:

```bash
./scripts/setup-obsidian-vault.sh
```

## Migração legacy

`docs/migration/` — histórico da migração Lojão → monorepo (Fase 8 concluída). Pode arquivar no vault quando não consultar mais.
