BACKEND = docker compose exec -T backend uv run
# run, not exec: frontend targets work even when only db and backend are up.
FRONTEND = docker compose run --rm --no-deps frontend

.PHONY: up down logs migrate seed test test-back test-front e2e lint lint-back lint-front fmt fmt-back fmt-front check prod-up licenses

# -V: fresh node_modules volume after a dependency change.
up:
	docker compose up -d --build -V

down:
	docker compose down

logs:
	docker compose logs -f

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

# Production, on the server, with the root .env filled from .env.prod.example.
prod-up:
	docker compose -f docker-compose.prod.yml up -d --build

licenses:
	./scripts/check_licenses.sh
