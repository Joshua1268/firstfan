BACKEND = docker compose exec -T backend uv run

.PHONY: up down logs migrate seed test test-back

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
