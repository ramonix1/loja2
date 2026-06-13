#!/usr/bin/env bash
# Gate local do job CI "e2e-smoke" — mesma ordem do .github/workflows/ci.yml
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="${COMPOSE:-docker compose -f docker-compose.yml -f docker-compose.ci.yml}"

echo "[ci-e2e] Instalando deps..."
corepack enable 2>/dev/null || true
pnpm install --frozen-lockfile
pnpm install --filter api... --filter e2e... --frozen-lockfile

echo "[ci-e2e] Playwright (antes do Docker)..."
node apps/e2e/scripts/run-playwright.mjs --version
node apps/e2e/scripts/run-playwright.mjs install --with-deps chromium

echo "[ci-e2e] Subindo só Postgres..."
$COMPOSE up --build -d db
timeout 60 bash -c 'until docker compose exec -T db pg_isready -U postgres -d lojao; do sleep 2; done'

echo "[ci-e2e] Seed no host..."
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lojao \
  node apps/api/scripts/run-seed.mjs || true

echo "[ci-e2e] Subindo api + admin + storefront..."
$COMPOSE up --build -d api admin storefront
timeout 180 bash -c 'until curl -sf http://localhost:3001/health; do sleep 3; done'
timeout 180 bash -c 'until curl -sf http://localhost:5173/; do sleep 3; done'
timeout 180 bash -c 'until curl -sf http://localhost:3000/; do sleep 3; done'

echo "[ci-e2e] E2E smoke..."
E2E_BASE_URL=http://localhost:5173 E2E_STORE_URL=http://localhost:3000 \
  node apps/e2e/scripts/run-playwright.mjs test --grep @smoke --pass-with-no-tests

echo "[ci-e2e] OK — job e2e-smoke passou localmente."
