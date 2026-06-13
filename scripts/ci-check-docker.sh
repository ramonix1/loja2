#!/usr/bin/env bash
# Gate local idêntico ao job "test" em .github/workflows/ci.yml
# (typecheck + api vitest + @lojao/db migrate test)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="${COMPOSE:-docker compose}"
NETWORK="${CI_NETWORK:-loja2_default}"

echo "[ci-check] Subindo Postgres..."
$COMPOSE up -d db

echo "[ci-check] Aguardando Postgres..."
for _ in $(seq 1 30); do
  if $COMPOSE exec -T db pg_isready -U postgres -d lojao >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "[ci-check] Banco limpo (como runner CI)..."
$COMPOSE exec -T db psql -U postgres -d lojao -v ON_ERROR_STOP=1 -c \
  "DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"

echo "[ci-check] Rodando typecheck + api test + db test (Node 24)..."
docker run --rm \
  --network "$NETWORK" \
  -v "$ROOT:/app" \
  -w /app \
  -e CI=true \
  -e DATABASE_URL=postgresql://postgres:postgres@db:5432/lojao \
  -e NODE_ENV=test \
  -e TENANT_SLUG=loja \
  -e PGSSL=disable \
  -e SESSION_SECRET=ci-session-secret \
  node:24-alpine sh -ec '
    apk add --no-cache python3 make g++ libc6-compat >/dev/null
    corepack enable
    pnpm install --frozen-lockfile
    pnpm ci:check
  '

echo "[ci-check] OK — mesmo gate do job CI \"test\" passou."
