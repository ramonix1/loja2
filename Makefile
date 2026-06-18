.DEFAULT_GOAL := help
COMPOSE_DB := docker compose -f docker-compose.db.yml
.PHONY: help install dev dev-all dev-ui dev-api dev-admin dev-storefront hybrid-setup clean-host clean-node-modules migrate-uploads-from-docker up up-d down restart reset \
        db-up db-up-d db-down db-reset \
        logs logs-all logs-api logs-admin logs-storefront \
        shell shell-api db api-install admin-install storefront-install deps-sync docker-rebuild \
        seed seed-fresh db-migrate db-generate db-studio \
        test test-api test-all test-e2e test-e2e-smoke typecheck build deploy-check \
        ci-check ci-check-docker ci-e2e-smoke-docker ci-gate

help: ## Lista os comandos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: ## pnpm install na raiz do monorepo
	pnpm install

dev-api: ## API Fastify :3001 — um terminal só da API
	pnpm dev:api

dev-admin: ## Admin Vite :5173 — um terminal só do admin
	pnpm dev:admin

dev-storefront: ## Storefront Next :3000 — um terminal só da vitrine
	pnpm dev:storefront

dev-all: ## Todos no mesmo terminal (turbo — logs misturados)
	pnpm dev:all

dev-ui: ## Todos com painéis separados no terminal (turbo TUI)
	pnpm dev:ui

dev: dev-all ## Alias de dev-all (prefira dev-api + dev-admin + dev-storefront)

clean-node-modules: clean-host ## Alias — limpa artefatos Docker no host

clean-host: ## Remove node_modules, .next, dist, .turbo contaminados pelo Docker
	@chmod +x scripts/clean-host.sh
	@./scripts/clean-host.sh

hybrid-setup: ## Prepara dev híbrido: para stack Docker, limpa deps, sobe Postgres, instala
	@$(MAKE) clean-host
	$(COMPOSE_DB) up -d
	pnpm install
	@test -f .env || cp .env.example .env
	@echo ""
	@echo "Ambiente híbrido pronto. Abra 3 terminais:"
	@echo "  make dev-api | make dev-admin | make dev-storefront"
	@echo "Depois (1ª vez): make seed"

migrate-uploads-from-docker: ## Copia imagens do volume Docker para data/uploads/images (híbrido)
	@mkdir -p data/uploads/images
	@docker run --rm \
		-v loja2_upload_data:/from:ro \
		-v "$(CURDIR)/data/uploads/images:/to" \
		alpine sh -c 'for f in /from/*; do [ -f "$$f" ] && cp -n "$$f" /to/; done; ls -la /to'
	@echo "Imagens copiadas para data/uploads/images"

db-up: ## Sobe só Postgres (modo híbrido)
	$(COMPOSE_DB) up

db-up-d: ## Sobe só Postgres em background (modo híbrido)
	$(COMPOSE_DB) up -d

db-down: ## Para Postgres (modo híbrido)
	$(COMPOSE_DB) down

db-reset: ## Apaga volume Postgres (modo híbrido)
	$(COMPOSE_DB) down -v

up: ## [Docker completo] Sobe api + admin + storefront + db (build)
	docker compose up --build

up-d: ## [Docker completo] Sobe api + admin + storefront + db em background
	docker compose up --build -d

up-proxy: ## Stack + Caddy proxy unificado (:8080)
	docker compose --profile proxy up --build -d

down: ## Para os containers
	docker compose down

restart: ## Reinicia todos os serviços
	docker compose restart

reset: ## Para containers e apaga o banco (down -v)
	docker compose down -v

logs: ## Logs de todos os serviços
	docker compose logs -f

logs-all: logs ## Alias para logs

logs-api: ## Logs do Fastify (api)
	docker compose logs -f api

logs-admin: ## Logs do admin (Vite)
	docker compose logs -f admin

logs-storefront: ## Logs do storefront (Next)
	docker compose logs -f storefront

shell-api: ## Shell no container api
	docker compose exec api sh

db: ## psql no Postgres (stack completa ou db-up-d)
	@docker compose exec db psql -U postgres -d lojao 2>/dev/null || \
		$(COMPOSE_DB) exec db psql -U postgres -d lojao

api-install: ## Reinstala deps da api nos volumes Docker
	docker compose exec -e CI=true api sh -c "rm -f /app/node_modules/.docker-lock-sha256 && cd /app && pnpm install --filter api..."
	docker compose restart api

admin-install: ## Reinstala deps do admin nos volumes Docker
	docker compose exec -e CI=true admin sh -c "rm -f /app/node_modules/.docker-lock-sha256 && cd /app && pnpm install --filter admin..."
	docker compose restart admin

storefront-install: ## Reinstala deps do storefront nos volumes Docker
	docker compose exec -e CI=true storefront sh -c "rm -f /app/node_modules/.docker-lock-sha256 && cd /app && pnpm install --filter storefront..."
	docker compose restart storefront

deps-sync: ## Força sync de deps em api + admin + storefront
	docker compose exec -e CI=true api sh -c "rm -f /app/node_modules/.docker-lock-sha256"
	docker compose exec -e CI=true admin sh -c "rm -f /app/node_modules/.docker-lock-sha256"
	docker compose exec -e CI=true storefront sh -c "rm -f /app/node_modules/.docker-lock-sha256"
	docker compose up -d --build

docker-rebuild: ## Rebuild completo das imagens (sem cache)
	docker compose build --no-cache

seed: ## Popula banco dev (Docker ou híbrido)
	@docker compose exec api pnpm seed:dev 2>/dev/null || pnpm seed

seed-fresh: ## Recria dados [DEV] do zero (Docker ou híbrido)
	@docker compose exec api pnpm seed:fresh 2>/dev/null || pnpm seed:fresh

db-migrate: ## Roda migrations Drizzle (@lojao/db)
	pnpm --filter @lojao/db db:migrate

db-generate: ## Gera migration após alteração de schema
	pnpm --filter @lojao/db db:generate

db-studio: ## Drizzle Studio (inspecionar banco)
	pnpm --filter @lojao/db db:studio

test: ## Testes turbo (api + packages)
	pnpm turbo test

test-api: ## Testes de integração da api (vitest) — requer Postgres
	pnpm --filter api test

test-api-smoke: ## Smoke bootstrap da api (health + login)
	pnpm --filter api test -- 00-bootstrap

test-all: ## api vitest + e2e @smoke — requer stack no ar
	pnpm test:all

test-e2e: ## Playwright completo — requer stack + browsers
	pnpm --filter e2e test

test-e2e-smoke: ## Playwright smoke (@smoke)
	pnpm test:e2e:smoke

typecheck: ## turbo typecheck
	pnpm turbo typecheck

build: ## turbo build (api + admin + storefront + packages)
	pnpm turbo build

ci-install: ## Valida pnpm-lock.yaml (igual Render e GitHub Actions)
	pnpm ci:install

deploy-check: ## Gate release: lockfile + typecheck + test + build
	pnpm ci:install && pnpm turbo typecheck && pnpm --filter api test && pnpm turbo build

ci-check: ## Mesmo gate do job CI "test" (typecheck + api + db) — requer Node 24 + deps no host
	pnpm turbo typecheck && pnpm --filter api test && pnpm --filter @lojao/db test

ci-check-docker: ## Gate CI no Docker (Node 24, banco limpo) — use antes de push
	@chmod +x scripts/ci-check-docker.sh
	@./scripts/ci-check-docker.sh

ci-e2e-smoke-docker: ## Gate CI e2e-smoke (stack + Playwright @smoke) — Node 24 via Docker
	@chmod +x scripts/ci-e2e-smoke-docker.sh
	@./scripts/ci-e2e-smoke-docker.sh

ci-gate: ## Gate completo antes de push (test + e2e-smoke, idêntico ao GHA)
	@chmod +x scripts/ci-gate.sh
	@./scripts/ci-gate.sh
