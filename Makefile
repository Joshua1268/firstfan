BACKEND = docker compose exec -T backend uv run

.PHONY: up down logs migrate seed test test-back lint lint-back fmt fmt-back check

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f

migrate:
	$(BACKEND) python manage.py migrate

seed:
	$(BACKEND) python manage.py seed_demo

test: test-back

test-back:
	$(BACKEND) pytest -q

lint: lint-back

lint-back:
	$(BACKEND) ruff check .
	$(BACKEND) ruff format --check .

fmt: fmt-back

fmt-back:
	$(BACKEND) ruff check --fix-only .
	$(BACKEND) ruff format .

check: lint test
