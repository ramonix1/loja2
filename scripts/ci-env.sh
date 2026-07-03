#!/usr/bin/env bash
# Defaults MA8 compartilhados pelos scripts de CI (seed test-loja + loja loja).
# Fonte: apps/api/tests/helpers/seed.ts + docker-compose.ci.yml (MASTER_*).
export CI_STORE_SLUG="${CI_STORE_SLUG:-loja}"
export CI_ADMIN_EMAIL="${CI_ADMIN_EMAIL:-admin@loja.com}"
export CI_ADMIN_PASSWORD="${CI_ADMIN_PASSWORD:-admin123}"
export CI_BUYER_EMAIL="${CI_BUYER_EMAIL:-comprador-test@loja.com}"
export CI_BUYER_PASSWORD="${CI_BUYER_PASSWORD:-comprador123}"
export CI_MASTER_EMAIL="${CI_MASTER_EMAIL:-master@suaplataforma.com}"
export CI_MASTER_PASSWORD="${CI_MASTER_PASSWORD:-troque-por-senha-forte-aqui}"

# Aliases Playwright (host runner)
export E2E_STORE_SLUG="${E2E_STORE_SLUG:-$CI_STORE_SLUG}"
export E2E_ADMIN_EMAIL="${E2E_ADMIN_EMAIL:-$CI_ADMIN_EMAIL}"
export E2E_ADMIN_PASSWORD="${E2E_ADMIN_PASSWORD:-$CI_ADMIN_PASSWORD}"
export E2E_BUYER_EMAIL="${E2E_BUYER_EMAIL:-$CI_BUYER_EMAIL}"
export E2E_BUYER_PASSWORD="${E2E_BUYER_PASSWORD:-$CI_BUYER_PASSWORD}"
export E2E_MASTER_EMAIL="${E2E_MASTER_EMAIL:-$CI_MASTER_EMAIL}"
export E2E_MASTER_PASSWORD="${E2E_MASTER_PASSWORD:-$CI_MASTER_PASSWORD}"
