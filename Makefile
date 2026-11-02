DEV = docker compose --profile dev
# Same project name as before the compose files were merged: keeps the existing media volume.
PROD = docker compose -p firstfan-prod --profile prod
BACKEND = $(DEV) exec -T backend uv run
# run, not exec: frontend targets work even when only db and backend are up.
FRONTEND = $(DEV) run --rm --no-deps frontend

.PHONY: up down logs logs-back logs-front migrate seed test test-back test-front e2e lint lint-back lint-front fmt fmt-back fmt-front check prod-up prod-logs licenses

# -V: fresh node_modules volume after a dependency change.
up:
	$(DEV) up -d --build -V

down:
	$(DEV) down

logs:
	$(DEV) logs -f

logs-back:
	$(DEV) logs -f backend

logs-front:
	$(DEV) logs -f frontend

migrate:
	$(BACKEND) python manage.py migrate

seed:
	$(BACKEND) python manage.py seed_demo

test: test-back test-front

# Tests check the real throttle rates, not the relaxed ones of the dev container.
test-back:
	$(BACKEND) env -u THROTTLE_LOGIN -u THROTTLE_ANON pytest -q

test-front:
	$(FRONTEND) pnpm test

e2e:
	cd frontend && pnpm exec playwright test

lint: lint-back lint-front

lint-back:
	$(BACKEND) ruff check .
	$(BACKEND) ruff format --check .

lint-front:
	$(FRONTEND) pnpm lint
	$(FRONTEND) pnpm format:check
	$(FRONTEND) pnpm typecheck
	$(FRONTEND) pnpm check:content

fmt: fmt-back fmt-front

fmt-back:
	$(BACKEND) ruff check --fix-only .
	$(BACKEND) ruff format .

fmt-front:
	$(FRONTEND) pnpm format

check: lint test

# Production, on the server, with the root .env filled from .env.example.
prod-up:
	$(PROD) up -d --build

prod-logs:
	$(PROD) logs -f --tail 200

licenses:
	./scripts/check_licenses.sh
