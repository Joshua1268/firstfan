# ENV (dev or prod) and PROXY_NETWORK come from the root .env, as for docker compose.
-include .env
PROXY_NETWORK ?= web_network

COMPOSE = docker compose
BACKEND = $(COMPOSE) exec -T firstfan-backend
# Checks run in one-off dev containers built from the current code: no need for make up or make watch.
RUN = $(COMPOSE) run --rm --no-deps
BACKEND_CHECK = $(RUN) firstfan-backend
FRONTEND_CHECK = $(RUN) firstfan-frontend
# The formatters write to the host code, mounted for that one command (node_modules stays the image's).
BACKEND_FIX = $(RUN) -v ./backend:/app firstfan-backend
FRONTEND_FIX = $(RUN) -v ./frontend:/app -v /app/node_modules firstfan-frontend

.PHONY: up down logs logs-back logs-front migrate seed test test-back test-front e2e lint lint-back lint-front fmt fmt-back fmt-front check build watch licenses

# The proxy network is external: created here on the Mac, already there on the server.
up:
	docker network inspect $(PROXY_NETWORK) >/dev/null 2>&1 || docker network create $(PROXY_NETWORK)
	$(COMPOSE) up -d --build

# Hot reload in dev, no code volume: compose copies each saved file into the running containers.
watch:
	$(COMPOSE) watch --no-up

down:
	$(COMPOSE) down

build:
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

# Tests check the real throttle rates, not the relaxed ones of the dev container.
test-back:
	$(BACKEND_CHECK) env -u THROTTLE_LOGIN -u THROTTLE_ANON pytest -q

test-front:
	$(FRONTEND_CHECK) pnpm test

e2e:
	cd frontend && pnpm exec playwright test

lint: lint-back lint-front

lint-back:
	$(BACKEND_CHECK) ruff check .
	$(BACKEND_CHECK) ruff format --check .

lint-front:
	$(FRONTEND_CHECK) pnpm lint
	$(FRONTEND_CHECK) pnpm format:check
	$(FRONTEND_CHECK) pnpm typecheck
	$(FRONTEND_CHECK) pnpm check:content

fmt: fmt-back fmt-front

fmt-back:
	$(BACKEND_FIX) ruff check --fix-only .
	$(BACKEND_FIX) ruff format .

fmt-front:
	$(FRONTEND_FIX) pnpm format

check: build lint test

licenses:
	./scripts/check_licenses.sh
