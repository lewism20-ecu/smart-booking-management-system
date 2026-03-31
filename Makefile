.PHONY: up down reset install-proxy proxy cloud-dev cloud-migrate cloud-setup

up:
	docker compose up --build

down:
	docker compose down

reset:
	docker compose down -v
	docker compose up --build

# --- Cloud SQL local dev ---
# Setup guide: docs/local-cloud-sql-setup.md
# Run once to install proxy: make install-proxy

CLOUDSQL_INSTANCE ?= $(shell grep GCP_CLOUDSQL_INSTANCE .env.cloudsql 2>/dev/null | cut -d= -f2)

install-proxy:
	curl -fsSL -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.3/cloud-sql-proxy.linux.amd64
	chmod +x cloud-sql-proxy
	@echo "cloud-sql-proxy ready. Run: make proxy"

proxy:
	@echo "Connecting to Cloud SQL instance: $(CLOUDSQL_INSTANCE)"
	./cloud-sql-proxy --port 5434 "$(CLOUDSQL_INSTANCE)"

cloud-dev:
	@echo "Starting API against Cloud SQL (proxy must be running in another terminal via: make proxy)"
	ENV_FILE=.env.cloudsql DB_HOST=127.0.0.1 DB_PORT=5434 DB_SSL=false \
	node src/index.js

cloud-migrate:
	@echo "Running migrations against Cloud SQL (proxy must be running via: make proxy)"
	ENV_FILE=.env.cloudsql DB_HOST=127.0.0.1 DB_PORT=5434 DB_SSL=false \
	npm run migrate

# Alias for setup intent: safe schema setup using migrations only.
cloud-setup: cloud-migrate
