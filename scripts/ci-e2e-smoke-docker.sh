#!/usr/bin/env bash
# Gate local idêntico ao job "e2e-smoke" em .github/workflows/ci.yml
# Roda pnpm/seed/Playwright em Node 24 (como GHA), não no Node do host.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.ci.yml"
NODE_IMAGE="${CI_NODE_IMAGE:-node:24-bookworm}"
PW_IMAGE="${CI_PLAYWRIGHT_IMAGE:-mcr.microsoft.com/playwright:v1.60.0-jammy}"

cleanup() {
  $COMPOSE down -v 2>/dev/null || true
}
trap cleanup EXIT

echo "[ci-e2e] Instalando deps (Node 24, como GHA)..."
docker run --rm --network host -v "$ROOT:/app" -w /app "$NODE_IMAGE" sh -ec '
  corepack enable
  pnpm install --frozen-lockfile
  pnpm install --filter api... --filter e2e... --frozen-lockfile
'

echo "[ci-e2e] Build workspace packages (dist/ não vai pro git; bind mount no CI)..."
docker run --rm --network host -v "$ROOT:/app" -w /app "$NODE_IMAGE" sh -ec '
  corepack enable
  pnpm turbo build --filter=@lojao/types --filter=@lojao/db
'

echo "[ci-e2e] Playwright CLI (antes do Docker)..."
docker run --rm --network host -v "$ROOT:/app" -w /app "$NODE_IMAGE" sh -ec '
  corepack enable
  node apps/e2e/scripts/run-playwright.mjs --version
'

echo "[ci-e2e] Subindo só Postgres..."
$COMPOSE up --build -d db
for i in $(seq 1 30); do
  if $COMPOSE exec -T db pg_isready -U postgres -d lojao >/dev/null 2>&1; then
    echo "[ci-e2e] Postgres pronto."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "[ci-e2e] TIMEOUT: Postgres não ficou pronto em 60s"
    exit 124
  fi
  sleep 2
done

echo "[ci-e2e] Banco limpo (como runner GHA fresco)..."
$COMPOSE exec -T db psql -U postgres -d lojao -v ON_ERROR_STOP=1 -c \
  "DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"

echo "[ci-e2e] Subindo api (bootstrap migrations)..."
chmod +x scripts/ci-wait-url.sh scripts/ci-verify-storefront.sh
$COMPOSE up --build -d api
scripts/ci-wait-url.sh api http://localhost:3001/health 180

echo "[ci-e2e] Seed dentro do container api (DATABASE_URL=db:5432)..."
$COMPOSE exec -T api node scripts/run-seed.mjs

echo "[ci-e2e] Subindo admin + storefront..."
$COMPOSE up --build -d admin storefront
$COMPOSE ps
scripts/ci-wait-url.sh admin http://localhost:5173/ 180
scripts/ci-wait-url.sh storefront http://localhost:3000/health 180
scripts/ci-verify-storefront.sh

echo "[ci-e2e] E2E smoke (Playwright image)..."
docker run --rm --network host -v "$ROOT:/app" -w /app \
  -e CI=true \
  -e E2E_BASE_URL=http://localhost:5173 \
  -e E2E_STORE_URL=http://localhost:3000 \
  "$PW_IMAGE" sh -ec '
    corepack enable
    pnpm install --frozen-lockfile >/dev/null
    node apps/e2e/scripts/run-playwright.mjs test --grep @smoke --pass-with-no-tests
  '

echo "[ci-e2e] OK — job e2e-smoke passou localmente (gate idêntico ao GHA)."
