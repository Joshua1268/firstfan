-include .env
PROXY_NETWORK ?= web_network

COMPOSE = docker compose
BACKEND = $(COMPOSE) exec -T firstfan-backend
RUN = $(COMPOSE) run --rm --no-deps
BACKEND_CHECK = $(RUN) firstfan-backend
FRONTEND_CHECK = $(RUN) firstfan-frontend
BACKEND_FIX = $(RUN) -v ./backend:/app firstfan-backend
FRONTEND_FIX = $(RUN) -v ./frontend:/app -v /app/node_modules firstfan-frontend

.PHONY: network up down logs logs-back logs-front migrate seed test test-back test-front e2e lint lint-back lint-front fmt fmt-back fmt-front check build watch licenses

network:
	docker network inspect $(PROXY_NETWORK) >/dev/null 2>&1 || docker network create $(PROXY_NETWORK)

up: network
	$(COMPOSE) up -d --build

watch:
	$(COMPOSE) watch --no-up

down:
	$(COMPOSE) down

build: network
	$(COMPOSE) build

logs:
	$(COMPOSE) logs -f --tail 200

logs-back:
	$(COMPOSE) logs -f --tail 200 firstfan-backend

logs-front:
	$(COMPOSE) logs -f --tail 200 firstfan-frontend

migrate:
	$(BACKEND) python manage.py migrate

seed:
	$(BACKEND) python manage.py seed_demo

test: test-back test-front

test-back: network
	$(BACKEND_CHECK) env -u THROTTLE_LOGIN -u THROTTLE_ANON pytest -q

test-front: network
	$(FRONTEND_CHECK) pnpm test

e2e:
	cd frontend && pnpm exec playwright test

lint: lint-back lint-front

lint-back: network
	$(BACKEND_CHECK) ruff check .
	$(BACKEND_CHECK) ruff format --check .

lint-front: network
	$(FRONTEND_CHECK) pnpm lint
	$(FRONTEND_CHECK) pnpm format:check
	$(FRONTEND_CHECK) pnpm typecheck
	$(FRONTEND_CHECK) pnpm check:content

fmt: fmt-back fmt-front

fmt-back: network
	$(BACKEND_FIX) ruff check --fix-only .
	$(BACKEND_FIX) ruff format .

fmt-front: network
	$(FRONTEND_FIX) pnpm format

check: build lint test

licenses:
	./scripts/check_licenses.sh
