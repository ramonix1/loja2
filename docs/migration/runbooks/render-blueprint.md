# Runbook — Deploy Render (Blueprint)

Deploy do monorepo Lojão via **Render Blueprint** (`render.yaml` na raiz).

## Pré-requisitos

- Repo no GitHub com `render.yaml` na branch `master` (ou `main`)
- Conta Render com permissão para criar Postgres + Web Services
- Node **24** (definido no blueprint via `NODE_VERSION`)

## Cenário A — Blueprint novo (recomendado)

1. **Apague ou suspenda** o serviço legado `loja2` que usava `node src/server.js` (Express removido na Fase 8).
2. No Render: **New → Blueprint**.
3. Conecte o repo `ramonixl/loja2`, branch `master`.
4. Revise os 4 recursos criados:
   - `lojao-db` (Postgres)
   - `lojao-api` (Web Service)
   - `lojao-storefront` (Web Service)
   - `lojao-admin` (Static Site — sem `plan`; static sites não usam tier no blueprint)
5. Preencha variáveis marcadas **sync: false** no dashboard:
   - `ADMIN_EMAIL`, `ADMIN_SENHA` (não use defaults em produção)
   - Stripe, SumUp, e-mail (se aplicável)
6. Aguarde o deploy. Ordem típica: DB → API → storefront/admin.
7. Se CORS/login do admin falhar na **primeira** subida, faça **Manual Deploy** em `lojao-api` após storefront e admin estarem no ar (vars `APP_URL`/`ADMIN_URL` dependem dos outros serviços).
8. Acesse:
   - Vitrine: URL de `lojao-storefront`
   - Admin: URL de `lojao-admin` → `/login`
   - API health: `https://<lojao-api>/health`

## Postgres existente

Se já tiver Postgres no Render e não quiser criar `lojao-db`:

1. Remova o bloco `databases:` do blueprint **antes** de aplicar, **ou**
2. Após criar, edite `lojao-api` → Environment → troque `DATABASE_URL` pela connection string do banco existente e delete `lojao-db` se ficou ocioso.

## Uploads de imagem

**Plano free:** não há disco persistente no Render. Uploads ficam no filesystem efêmero da API e **somem a cada redeploy**. Para produção com imagens, use plano pago + disco no `render.yaml` ou storage externo (S3, Cloudinary, etc.).

```yaml
# Exemplo (somente plano pago):
# disk:
#   name: lojao-uploads
#   mountPath: /opt/render/project/src/data/uploads/images
#   sizeGB: 1
```

## Webhooks (Stripe / SumUp)

Após deploy, configure URLs apontando para a API pública:

- `https://<lojao-api>/webhook/stripe`
- `https://<lojao-api>/webhook/sumup`

## Domínio customizado (opcional)

Vincule domínios em cada serviço no dashboard. Atualize `APP_URL`, `ADMIN_URL` e rebuild se usar URLs fixas — o blueprint usa `RENDER_EXTERNAL_URL` entre serviços.

## Troubleshooting

| Sintoma | Causa provável |
|---------|----------------|
| `Cannot find module ... server.js` | Serviço legado ainda ativo; use Blueprint, não o serviço antigo |
| API não conecta ao Postgres | SSL: não defina `PGSSL=disable` em produção Render |
| Admin login falha (401 após login) | CORS/cookie: `COOKIE_SAME_SITE=none` na API; `ADMIN_URL` deve bater com URL do admin |
| Imagens 404 após redeploy | Free tier: uploads efêmeros; upgrade ou storage externo |
| Imagens 404 (geral) | `UPLOAD_DIR` incorreto ou arquivo nunca persistido |
| Build falha Node 20 | Defina `NODE_VERSION=24` (já no blueprint) |

## Verificação local antes do push

```bash
pnpm install
make deploy-check
```
