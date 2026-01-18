.PHONY: help build-dashboard build-api build-docker run clean test dev-dashboard dev-api docker-up docker-down

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build-dashboard: ## Build dashboard (React)
	@echo "Building dashboard..."
	cd mocktail-dashboard && yarn install --frozen-lockfile && yarn build

build-api: ## Build Go API binary
	@echo "Building API..."
	cd mocktail-api && go mod download && go build -o mocktail-api

build-docker: ## Build Docker image
	@echo "Building Docker image..."
	docker build -t mocktail:latest .

build: build-dashboard build-api ## Build both dashboard and API

run: ## Run the API locally (requires built dashboard in mocktail-api/build)
	@echo "Starting API server on :4000..."
	cd mocktail-api && ./mocktail-api

dev-dashboard: ## Run dashboard in development mode
	@echo "Starting dashboard dev server on :3001..."
	cd mocktail-dashboard && yarn start

dev-api: ## Run API in development mode (debug with VSCode or go run)
	@echo "Starting API dev server on :4000..."
	cd mocktail-api && go run main.go

docker-up: ## Start with docker-compose
	docker-compose up -d

docker-down: ## Stop docker-compose
	docker-compose down

docker-build: ## Build and start with docker-compose
	docker-compose up -d --build

clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	rm -rf mocktail-dashboard/build
	rm -rf mocktail-dashboard/node_modules
	rm -f mocktail-api/mocktail-api
	docker-compose down -v
