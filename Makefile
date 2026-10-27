BACKEND = docker compose exec -T backend uv run
# run, not exec: frontend targets work even when only db and backend are up.
FRONTEND = docker compose run --rm --no-deps frontend

.PHONY: up down logs migrate seed test test-back test-front e2e lint lint-back fmt fmt-back check

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

test-back:
	$(BACKEND) pytest -q

test-front:
	$(FRONTEND) pnpm test

e2e:
	cd frontend && pnpm exec playwright test

lint: lint-back

lint-back:
	$(BACKEND) ruff check .
	$(BACKEND) ruff format --check .

fmt: fmt-back

fmt-back:
	$(BACKEND) ruff check --fix-only .
	$(BACKEND) ruff format .

check: lint test
