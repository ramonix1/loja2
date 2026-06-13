#!/usr/bin/env bash
# Valida storefront como no CI: /health, SSR da home e API interna (api:3001).
set -euo pipefail

COMPOSE="${COMPOSE:-docker compose -f docker-compose.yml -f docker-compose.ci.yml}"

echo "[verify-storefront] env no container (HOSTNAME não deve ser usado no SSR)..."
$COMPOSE exec -T storefront printenv HOSTNAME API_URL SKIP_DOCKER_DEPS_SYNC 2>/dev/null || true

echo "[verify-storefront] GET /health..."
curl -sf http://localhost:3000/health >/dev/null

echo "[verify-storefront] API direta (api:3001) de dentro do container..."
$COMPOSE exec -T storefront node -e "
  fetch('http://api:3001/api/v1/public/store', { headers: { 'X-Tenant-Slug': 'loja' } })
    .then((r) => {
      console.log('direct-api', r.status);
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
  exit 1
fi

echo "[verify-storefront] GET / de dentro do container..."
$COMPOSE exec -T storefront node -e "
  fetch('http://127.0.0.1:3000/', { headers: { accept: 'text/html' } })
    .then((r) => {
      console.log('in-container home', r.status);
      process.exit(r.ok ? 0 : 1);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
"

# Simula GHA: HOSTNAME = ID do container (o bug que quebrava o SSR same-origin).
echo "[verify-storefront] simula HOSTNAME do GHA (não deve afetar SSR com api:3001)..."
$COMPOSE exec -T -e HOSTNAME=gha-runner-fake-id storefront node -e "
  const api = process.env.API_URL ?? 'http://api:3001';
  fetch(api + '/api/v1/public/store', { headers: { 'X-Tenant-Slug': 'loja' } })
    .then((r) => {
      console.log('with-fake-HOSTNAME', r.status);
      process.exit(r.ok ? 0 : 1);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
"

echo "[verify-storefront] OK"
