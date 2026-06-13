#!/usr/bin/env bash
# Gate local do job CI "e2e-smoke" (stack + seed + Playwright @smoke).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="${COMPOSE:-docker compose}"
NETWORK="${CI_NETWORK:-loja2_default}"

echo "[ci-e2e] Subindo stack..."
$COMPOSE up --build -d

echo "[ci-e2e] Aguardando serviços..."
timeout 180 bash -c 'until curl -sf http://localhost:3001/health; do sleep 3; done'
timeout 180 bash -c 'until curl -sf http://localhost:5173/; do sleep 3; done'
timeout 180 bash -c 'until curl -sf http://localhost:3000/; do sleep 3; done'

echo "[ci-e2e] Seed no host (como CI)..."
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lojao \
  docker run --rm --network "$NETWORK" \
  -v "$ROOT:/app" -w /app \
  -e CI=true \
  -e DATABASE_URL=postgresql://postgres:postgres@db:5432/lojao \
  node:24-alpine sh -ec '
    apk add --no-cache python3 make g++ libc6-compat git >/dev/null
    corepack enable
    pnpm install --frozen-lockfile >/dev/null
    node apps/api/scripts/run-seed.mjs || true
  '

echo "[ci-e2e] Playwright verify + browsers + smoke..."
docker run --rm --network host \
  -v "$ROOT:/app" -w /app \
  -e CI=true \
  -e E2E_BASE_URL=http://localhost:5173 \
  -e E2E_STORE_URL=http://localhost:3000 \
  mcr.microsoft.com/playwright:v1.60.0-jammy sh -ec '
    corepack enable
    pnpm install --frozen-lockfile >/dev/null
    node apps/e2e/scripts/run-playwright.mjs --version
    node apps/e2e/scripts/run-playwright.mjs install chromium
    node apps/e2e/scripts/run-playwright.mjs test --grep @smoke --pass-with-no-tests
  '

echo "[ci-e2e] OK — job e2e-smoke passou localmente."
