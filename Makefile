.DEFAULT_GOAL := help
.PHONY: help install up up-d up-full up-full-d down restart reset \
        logs logs-all logs-api logs-legacy logs-admin \
        shell shell-api db api-install admin-install deps-sync docker-rebuild \
        seed seed-fresh \
        test test-api test-all test-e2e test-e2e-smoke typecheck

help: ## Lista os comandos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

install: ## pnpm install na raiz do monorepo
	pnpm install

up: ## Sobe legacy + api + db (build)
	docker compose up --build

up-d: ## Sobe legacy + api + db em background
	docker compose up --build -d

up-full: ## Sobe legacy + api + admin + db (profile full)
	docker compose --profile full up --build

up-full-d: ## Sobe legacy + api + admin + db (profile full) em background
	docker compose --profile full up --build -d

down: ## Para os containers
	docker compose down

restart: ## Reinicia o serviço legacy
	docker compose restart legacy

reset: ## Para containers e apaga o banco (down -v)
	docker compose down -v

logs: ## Logs do legacy
	docker compose logs -f legacy

logs-all: ## Logs de todos os serviços
	docker compose logs -f

logs-api: ## Logs do Fastify (api)
	docker compose logs -f api

logs-legacy: ## Logs do Express (legacy)
	docker compose logs -f legacy

logs-admin: ## Logs do admin (Vite) — requer profile full
	docker compose logs -f admin

shell: ## Shell no container legacy
	docker compose exec legacy sh

shell-api: ## Shell no container api
	docker compose exec api sh

db: ## psql no Postgres
	docker compose exec db psql -U postgres -d lojao

api-install: ## Reinstala deps da api nos volumes Docker (após pnpm add na api)
	docker compose exec -e CI=true api sh -c "rm -f /app/node_modules/.docker-lock-sha256 && cd /app && pnpm install --filter api..."
	docker compose restart api

admin-install: ## Reinstala deps do admin nos volumes Docker (após pnpm add no admin)
	docker compose --profile full exec -e CI=true admin sh -c "rm -f /app/node_modules/.docker-lock-sha256 && cd /app && pnpm install --filter admin..."
	docker compose --profile full restart admin

deps-sync: ## Força sync de deps em api + admin + legacy (após mudança no lockfile)
	docker compose exec -e CI=true api sh -c "rm -f /app/node_modules/.docker-lock-sha256"
	docker compose --profile full exec -e CI=true admin sh -c "rm -f /app/node_modules/.docker-lock-sha256" 2>/dev/null || true
	docker compose exec -e CI=true legacy sh -c "rm -f /app/node_modules/.docker-lock-sha256"
	docker compose --profile full up -d --build

docker-rebuild: ## Rebuild completo das imagens (sem cache)
	docker compose --profile full build --no-cache

seed: ## Popula banco dev (produtos, compradores, pedidos, pagamentos)
	docker compose exec legacy node scripts/seed-dev.js

seed-fresh: ## Recria dados [DEV] do zero
	docker compose exec legacy node scripts/seed-dev.js --fresh

test: ## Testes do legacy (Jest) — escopo até Fase 8
	pnpm --filter legacy test

test-api: ## Testes de integração da api (vitest) — requer Postgres (make up-d db)
	pnpm --filter api test

test-api-smoke: ## Smoke bootstrap da api (health + login) — falha cedo se deps/import quebrados
	pnpm --filter api test -- 00-bootstrap

test-all: ## Testes legacy (Jest) + api (vitest) — requer Postgres p/ api
	pnpm --filter legacy --filter api test

test-e2e: ## Playwright admin — requer stack no ar (make up-full-d) + browsers
	pnpm --filter e2e test

test-e2e-smoke: ## Playwright smoke (@smoke) — requer stack no ar + browsers
	pnpm test:e2e:smoke

typecheck: ## turbo typecheck em api e packages
	pnpm turbo typecheck
