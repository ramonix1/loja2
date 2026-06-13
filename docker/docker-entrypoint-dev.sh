#!/bin/sh
# Sincroniza node_modules nos volumes nomeados quando o lockfile muda ou o volume está vazio.
# Evita ERR_MODULE_NOT_FOUND / "Failed to resolve import" após pnpm add no host.
set -e

FILTER="${PNPM_FILTER:?PNPM_FILTER is required (ex.: admin...)}"
LOCK="/app/pnpm-lock.yaml"
MARKER="/app/node_modules/.docker-lock-sha256"

cd /app

if [ ! -f "$LOCK" ]; then
  echo "[entrypoint] ERRO: $LOCK não encontrado (bind mount ok?)"
  exit 1
fi

CURRENT=$(sha256sum "$LOCK" | awk '{print $1}')
STORED=""
[ -f "$MARKER" ] && STORED=$(cat "$MARKER")

SYNC=false
if [ ! -d "node_modules/.pnpm" ]; then
  SYNC=true
fi
if [ -d "node_modules/.pnpm" ] && [ ! -f "$MARKER" ]; then
  SYNC=true
fi
if [ "$CURRENT" != "$STORED" ]; then
  SYNC=true
fi

if [ "$SYNC" = true ]; then
  echo "[entrypoint] Sincronizando deps (${FILTER})..."
  CI=true pnpm install --filter "${FILTER}" --prefer-offline
  # Workspace packages (ex.: @lojao/db) precisam de node_modules próprio no bind mount;
  # o volume nomeado só cobre /app/node_modules e apps/*/node_modules.
  if echo "$FILTER" | grep -q 'api'; then
    CI=true pnpm install --filter @lojao/db... --prefer-offline
  fi
  mkdir -p node_modules
  echo "$CURRENT" > "$MARKER"
  echo "[entrypoint] Deps OK."
fi

exec "$@"
