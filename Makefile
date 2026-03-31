.PHONY: up down reset

up:
	docker compose up --build

down:
	docker compose down

reset:
	docker compose down -v
	docker compose up --build
