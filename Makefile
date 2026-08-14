.PHONY: help build-ui build-api build-docker run clean test dev-ui dev-api docker-up docker-down

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build-ui: ## Build the UI (Vite) and stage it where the Go binary serves it (mocktail-api/build)
	@echo "Building UI..."
	cd mocktail-ui && yarn install --frozen-lockfile && yarn build
	rm -rf mocktail-api/build && cp -r mocktail-ui/build mocktail-api/build && touch mocktail-api/build/.gitkeep

build-api: ## Build Go API binary
	@echo "Building API..."
	cd mocktail-api && go mod download && go build -o mocktail-api

build-docker: ## Build Docker image
	@echo "Building Docker image..."
	docker build -t mocktail:latest .

build: build-ui build-api ## Build both UI and API

run: ## Run the API locally (requires built UI in mocktail-api/build)
	@echo "Starting API server on :6625..."
	cd mocktail-api && MOCKTAIL_DB_PATH=db/apis.db ./mocktail-api

dev-ui: ## Run the UI in development mode (Vite)
	@echo "Starting UI dev server on :3001..."
	cd mocktail-ui && yarn dev

dev-api: ## Run API in development mode (debug with VSCode or go run)
	@echo "Starting API dev server on :6625..."
	cd mocktail-api && MOCKTAIL_DB_PATH=db/apis.db go run main.go

docker-up: ## Start with docker-compose
	docker-compose up -d

docker-down: ## Stop docker-compose
	docker-compose down

docker-build: ## Build and start with docker-compose
	docker-compose up -d --build

clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	rm -rf mocktail-ui/build
	rm -rf mocktail-ui/node_modules
	rm -f mocktail-api/mocktail-api
	docker-compose down -v
