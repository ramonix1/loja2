#!/usr/bin/env bash
# Bloqueia regressões de CI para padrões legado removidos no cutover MA8.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FILES=(
  .github/workflows/ci.yml
  docker-compose.ci.yml
  scripts/ci-verify-storefront.sh
  scripts/ci-e2e-smoke-docker.sh
  scripts/ci-check-docker.sh
  scripts/ci-gate.sh
  scripts/ci-env.sh
  apps/api/scripts/run-seed.mjs
  docker/Dockerfile.storefront
  docker/Dockerfile.api
  docker/Dockerfile.admin
)

CHECKS=(
  'X-Tenant-Slug'
  'packages/tenant-host'
  'BOOTSTRAP_TENANT_SLUGS'
  'FROM tenants'
  'INTO tenants'
  'seed-dev\.mjs'
)

failed=0

for f in "${FILES[@]}"; do
  [ -f "$f" ] || continue
  for pattern in "${CHECKS[@]}"; do
    if grep -qE "$pattern" "$f"; then
      echo "ci-guard FALHOU: $f ainda referencia legado ($pattern)"
      grep -nE "$pattern" "$f" || true
      failed=1
    fi
  done
done

if [ "$failed" -ne 0 ]; then
  echo ""
  echo "Corrija os arquivos acima (MA8: merchants/stores, X-Store-Slug, @lojao/store-host)."
  exit 1
fi

echo "ci-guard OK — nenhum padrão legado bloqueante nos arquivos de CI."
