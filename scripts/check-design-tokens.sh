#!/usr/bin/env bash
# Detecta cores legadas (gray-*, blue-*, #2563eb) fora do design system.
# Fase 0: baseline — falha se o total AUMENTAR (regressão).
# Fase 7+: STRICT=1 falha em qualquer ocorrência.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASELINE_FILE="${ROOT}/scripts/design-tokens-baseline.count"
PATTERN='gray-[0-9]|#2563eb|blue-[0-9]'
SCAN_PATHS=(
  "${ROOT}/apps/admin"
  "${ROOT}/apps/storefront"
  "${ROOT}/packages/ui"
)

count_matches() {
  local n
  n="$(rg -n "${PATTERN}" "${SCAN_PATHS[@]}" \
    --glob '*.{tsx,ts,css}' \
    --glob '!**/node_modules/**' 2>/dev/null | wc -l | tr -d ' ')"
  echo "${n:-0}"
}

COUNT="$(count_matches)"
STRICT="${STRICT:-0}"

echo "check-design-tokens: ${COUNT} ocorrência(s) de gray-*/blue-*/#2563eb"
echo "  paths: apps/admin, apps/storefront, packages/ui"

if [[ "${STRICT}" == "1" ]]; then
  if [[ "${COUNT}" -gt 0 ]]; then
    echo ""
    echo "STRICT=1 — listando ocorrências:"
    rg -n "${PATTERN}" "${SCAN_PATHS[@]}" \
      --glob '*.{tsx,ts,css}' \
      --glob '!**/node_modules/**' 2>/dev/null | head -40
    echo ""
    echo "Falha: remova cores legadas antes do gate final (Fase 7)."
    exit 1
  fi
  echo "OK — zero ocorrências legadas."
  exit 0
fi

if [[ ! -f "${BASELINE_FILE}" ]]; then
  echo "Baseline ausente — criando ${BASELINE_FILE} com count=${COUNT}"
  echo "${COUNT}" > "${BASELINE_FILE}"
  exit 0
fi

BASELINE="$(tr -d ' \n' < "${BASELINE_FILE}")"

if [[ "${COUNT}" -gt "${BASELINE}" ]]; then
  echo ""
  echo "Regressão: ${COUNT} > baseline ${BASELINE}"
  rg -n "${PATTERN}" "${SCAN_PATHS[@]}" \
    --glob '*.{tsx,ts,css}' \
    --glob '!**/node_modules/**' 2>/dev/null | tail -20
  exit 1
fi

if [[ "${COUNT}" -lt "${BASELINE}" ]]; then
  echo "Melhoria: ${COUNT} < baseline ${BASELINE} — atualize scripts/design-tokens-baseline.count"
fi

echo "OK — dentro do baseline (${BASELINE})."
