#!/usr/bin/env bash
# Valida storefront + API como no GHA (falha se public/store não for 200).
set -euo pipefail

COMPOSE="${COMPOSE:-docker compose -f docker-compose.yml -f docker-compose.ci.yml}"

echo "[verify-storefront] tenants.db_host (diagnóstico localhost vs db)..."
$COMPOSE exec -T db psql -U postgres -d lojao -t -c \
  "SELECT slug, db_host FROM tenants WHERE slug = 'loja';" 2>/dev/null || true

echo "[verify-storefront] GET /health..."
curl -sf http://localhost:3000/health >/dev/null

echo "[verify-storefront] API public/store (host → api:3001)..."
API_STATUS=$(curl -s -o /tmp/ci-public-store.json -w '%{http_code}' \
  -H 'X-Tenant-Slug: loja' http://localhost:3001/api/v1/public/store || echo "000")
if [ "$API_STATUS" != "200" ]; then
  echo "[verify-storefront] FALHOU: public/store HTTP $API_STATUS"
  cat /tmp/ci-public-store.json 2>/dev/null || true
  $COMPOSE logs api --tail 60 || true
  exit 1
fi

echo "[verify-storefront] API direta de dentro do storefront..."
$COMPOSE exec -T storefront node -e "
  fetch('http://api:3001/api/v1/public/store', { headers: { 'X-Tenant-Slug': 'loja' } })
    .then(async (r) => {
      const body = await r.text();
      console.log('direct-api', r.status, body.slice(0, 120));
      process.exit(r.ok ? 0 : 1);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
"

echo "[verify-storefront] GET / (SSR via host)..."
STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/ 2>/dev/null || echo "000")
if [ "$STATUS" != "200" ]; then
  echo "[verify-storefront] FALHOU: GET / retornou HTTP $STATUS"
  $COMPOSE logs storefront --tail 80 || true
  $COMPOSE logs api --tail 40 || true
  exit 1
fi

echo "[verify-storefront] OK"
