# Status — Ata Labs Platform

> **Agente implementador:** atualize este arquivo ao concluir cada fase.

## Fase ativa

| Campo | Valor |
|-------|-------|
| **Fase ativa** | B (`ata-b`) |
| **Iniciada em** | — |
| **Concluída em** | — |
| **Responsável** | — |

## Progresso por fase

| Fase | Nome | Status | Data conclusão | Notas |
|------|------|--------|----------------|-------|
| A | Infra DNS + CDN R2 | `done` | 2026-06-19 | DNS Cloudflare + Render sem limite (humano); código `assetUrl` CDN, `render.yaml`, runbook |
| B | Migração URLs imagens | `pending` | — | Script Postgres |
| C | Branding UI | `pending` | — | Ata Labs / Ata Commerce |
| D | Multi-tenant path | `pending` | — | `/store/[slug]` + tenant-host |
| E | Login admin tenant | `pending` | — | Slug na sessão |
| F | Platform Hub | `pending` | — | `/platform` + CRUD tenants |

Status permitidos: `pending` | `in_progress` | `blocked` | `done`

## Bloqueios / decisões pendentes

- Fase B: migrar paths `/images/...` no Postgres para URLs absolutas CDN (consistência; bandwidth já mitigada na Fase A)
- `TENANT_SLUG=loja` ainda fixo em `render.yaml` — remover após Fase D/E

## Log de entregas

### 2026-06-19 — Fase A — Infra DNS + CDN R2

- DNS Cloudflare e custom domains Render configurados manualmente
- `render.yaml`: `R2_DELIVERY=cdn`, `R2_PUBLIC_URL`, URLs Ata Labs fixas
- Storefront: `assetUrl()` usa `NEXT_PUBLIC_CDN_URL`; `/images/*` redireciona 301 para CDN
- Admin: `assetImageUrl()` usa `VITE_CDN_URL`
- API: GET `/images/*` em modo CDN → redirect 301 (sem ler R2/disco)
- `.env.example` e runbook Render atualizados
- **Pendente pós-deploy:** Manual Deploy API → admin → storefront; validar Network tab (só `cdn.atalabs.com.br`)
