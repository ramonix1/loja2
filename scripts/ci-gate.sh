#!/usr/bin/env bash
# Gate completo antes de push: job "test" + job "e2e-smoke" (como .github/workflows/ci.yml)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=========================================="
echo " CI GATE — espelha GitHub Actions"
echo " Rode isto antes de git push"
echo "=========================================="

chmod +x scripts/ci-check-docker.sh scripts/ci-e2e-smoke-docker.sh
./scripts/ci-check-docker.sh
./scripts/ci-e2e-smoke-docker.sh

echo ""
echo "=========================================="
echo " CI GATE OK — seguro para push"
echo "=========================================="
