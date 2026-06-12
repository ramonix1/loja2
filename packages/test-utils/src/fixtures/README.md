# Fixtures de teste — credenciais dev

Dados de apoio para testes locais e E2E (QA). **Nunca** usar estas credenciais em produção.

## Tenant de desenvolvimento

| Campo | Valor |
|-------|-------|
| `TENANT_SLUG` | `loja` |
| Provisionamento | Automático no boot do legacy (`config/init-db.js`) quando `TENANT_SLUG` + `DATABASE_URL` estão definidos |

## Usuário admin (loja)

| Campo | Valor |
|-------|-------|
| Email | `admin@loja.com` |
| Senha | `admin123` |
| Role | `admin` |

Definido pelas envs `ADMIN_EMAIL` / `ADMIN_SENHA` / `ADMIN_NOME` no `docker-compose.yml` (serviço `legacy`).

## URLs dev

| App | URL |
|-----|-----|
| Legacy (Express + EJS) | http://localhost:3000 |
| API (Fastify) | http://localhost:3001 |
| API health | http://localhost:3001/health |

## Uso futuro

A partir da Fase 2, este diretório recebe helpers de seed (`createTestOrder()`,
`storageState` de login) consumidos pelos specs Playwright em `apps/e2e/`.
Na Fase 0 contém apenas documentação — sem código executável.
