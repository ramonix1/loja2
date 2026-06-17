#!/usr/bin/env sh
# Limpa artefatos do host criados como root pelo Docker (bind mount .:/app).
# Não exige sudo — usa container Alpine.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

UID_GID="$(id -u):$(id -g)"

echo "[clean-host] Parando stack Docker completa (se estiver no ar)..."
docker compose down 2>/dev/null || true

echo "[clean-host] Removendo node_modules, caches e builds (uid=$UID_GID)..."

docker run --rm \
  -v "$ROOT:/app" \
  -w /app \
  alpine sh -c '
    rm -rf \
      node_modules \
      .pnpm-store \
      .turbo \
      apps/api/node_modules \
      apps/api/dist \
      apps/admin/node_modules \
      apps/admin/dist \
      apps/storefront/node_modules \
      apps/storefront/.next \
      apps/e2e/node_modules \
      packages/db/node_modules \
      packages/db/.turbo \
      packages/db/dist \
      packages/types/node_modules \
      packages/types/dist \
      packages/test-utils/node_modules \
      packages/test-utils/dist \
      packages/ui/node_modules \
      packages/ui/dist \
      packages/eslint-config/node_modules
    find apps packages -type d -name .turbo -prune -exec rm -rf {} + 2>/dev/null || true
    find apps packages -type d -name dist -prune -exec rm -rf {} + 2>/dev/null || true
  '

echo "[clean-host] Corrigindo ownership de arquivos restantes como root..."
docker run --rm \
  -v "$ROOT:/app" \
  -w /app \
  alpine sh -c "chown -R $UID_GID /app"

echo "[clean-host] Pronto. Rode: pnpm install && make dev"
