.PHONY: help build up down logs clean dev dev-down

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build Docker images
	docker-compose build

up: ## Start all services (production mode)
	docker-compose up -d

down: ## Stop all services
	docker-compose down

logs: ## View logs from all services
	docker-compose logs -f

dev: ## Start all services in development mode with hot reload
	docker-compose -f docker-compose.dev.yml up

dev-down: ## Stop development services
	docker-compose -f docker-compose.dev.yml down

clean: ## Remove all containers, volumes, and images
	docker-compose down -v --rmi all

restart: down up ## Restart all services

prod: ## Start production services (build + up)
	docker-compose up --build -d
	@echo ""
	@echo "✅ Services started!"
	@echo "🌐 Data Integrity Demo: http://localhost:8080"
	@echo ""
	@echo "To stop: make down"
	@echo "To view logs: make logs"
