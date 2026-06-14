#!/usr/bin/env bash
# Aguarda URL com logs periódicos; em timeout, despeja logs do serviço Docker.
set -euo pipefail

SERVICE="${1:?service name (ex.: admin)}"
URL="${2:?url (ex.: http://localhost:5173/)}"
TIMEOUT="${3:-180}"
COMPOSE="${COMPOSE:-docker compose -f docker-compose.yml -f docker-compose.ci.yml}"

echo "[wait] Aguardando ${SERVICE} em ${URL} (timeout ${TIMEOUT}s)..."
START=$(date +%s)
ATTEMPT=0

while true; do
  ATTEMPT=$((ATTEMPT + 1))
  if curl -sf "$URL" >/dev/null 2>&1; then
    ELAPSED=$(( $(date +%s) - START ))
    echo "[wait] ${SERVICE} OK em ${ELAPSED}s (tentativa ${ATTEMPT})"
    exit 0
  fi

  ELAPSED=$(( $(date +%s) - START ))
  if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
    echo "[wait] TIMEOUT: ${SERVICE} não respondeu em ${TIMEOUT}s"
    $COMPOSE ps || true
    $COMPOSE logs --tail 100 "$SERVICE" || true
    exit 124
  fi

  if [ $((ATTEMPT % 5)) -eq 0 ]; then
    echo "[wait] ${SERVICE} ainda aguardando... ${ELAPSED}s/${TIMEOUT}s"
  fi
  sleep 3
done
