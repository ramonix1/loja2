.DEFAULT_GOAL := help

# ─────────────────────────────────────────────
#  Lojão — Makefile
# ─────────────────────────────────────────────

.PHONY: help up down restart logs shell db test reset install

help: ## Exibe esta mensagem de ajuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

up: ## Sobe todos os serviços (build automático na primeira vez)
	docker compose up --build

up-d: ## Sobe todos os serviços em background (detached)
	docker compose up --build -d

down: ## Para e remove os containers
	docker compose down

restart: ## Reinicia apenas o container da aplicação
	docker compose restart app

logs: ## Exibe os logs da aplicação em tempo real
	docker compose logs -f app

logs-all: ## Exibe os logs de todos os serviços em tempo real
	docker compose logs -f

shell: ## Abre um terminal dentro do container da aplicação
	docker compose exec app sh

db: ## Abre o psql dentro do container do banco de dados
	docker compose exec db psql -U postgres -d lojao

install: ## Reinstala as dependências dentro do container (após alterar package.json)
	docker compose exec app npm install

test: ## Roda os testes dentro do container
	docker compose exec app npm test

test-unit: ## Roda apenas os testes unitários
	docker compose exec app npm run test:unit

test-integration: ## Roda apenas os testes de integração
	docker compose exec app npm run test:integration

reset: ## Para os containers e APAGA todos os volumes (banco incluso) — use com cuidado
	docker compose down -v
