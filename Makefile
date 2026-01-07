.PHONY: help up down restart logs clean clean-stale setup build check-env build-services start-services wait-services

# Default target
help:
	@echo "NEFOS Project Makefile"
	@echo ""
	@echo "Available targets:"
	@echo "  make up       - Build and start all services in detached mode, then run setup"
	@echo "  make down     - Stop all services"
	@echo "  make restart  - Restart all services (down then up)"
	@echo "  make logs     - View logs from all services"
	@echo "  make setup    - Run setup script (create superusers and media directories)"
	@echo "  make build    - Build all Docker images without starting"
	@echo "  make clean    - Stop services and remove volumes (WARNING: deletes data)"
	@echo "  make help     - Show this help message"

# Main target: build, start services, and run setup
up: check-env clean-stale build-services start-services wait-services setup
	@echo ""
	@echo "========================================="
	@echo "✓ All services are up and running!"
	@echo "========================================="
	@echo ""
	@echo "Services:"
	@echo "  - Frontend:      http://localhost:5173"
	@echo "  - UserService:   http://localhost:8000"
	@echo "  - TeamService:   http://localhost:8001"
	@echo "  - TaskService:   http://localhost:8002"
	@echo "  - MongoDB:       localhost:27017"
	@echo "  - Mongo Express: http://localhost:8081"
	@echo ""

# Check if .env file exists, create from .env.example if not
check-env:
	@if [ ! -f .env ]; then \
		if [ -f .env.example ]; then \
			echo "Creating .env file from .env.example..."; \
			cp .env.example .env; \
			echo "✓ .env file created. Please review and update the values if needed."; \
		else \
			echo "Error: .env.example not found!"; \
			exit 1; \
		fi; \
	else \
		echo ".env file exists, skipping creation."; \
	fi

# Clean up any stale containers that might conflict
clean-stale:
	@echo "Checking for stale containers..."
	@for container in postgres mongodb userservice teamservice taskservice frontend mongo-express; do \
		if docker ps -a --format '{{.Names}}' | grep -q "^$$container$$"; then \
			echo "Removing stale container: $$container"; \
			docker rm -f $$container 2>/dev/null || true; \
		fi; \
	done
	@echo "✓ Stale container check complete"

# Build Docker images
build-services:
	@echo "Building Docker images..."
	@docker compose build

# Start services in detached mode
start-services:
	@echo "Starting services..."
	@docker compose up -d

# Wait for services to be healthy
wait-services:
	@echo "Waiting for services to be ready..."
	@echo "Waiting for PostgreSQL to be healthy..."
	@timeout=60; elapsed=0; \
	while [ $$elapsed -lt $$timeout ]; do \
		if docker compose ps postgres | grep -q "healthy"; then \
			echo "✓ PostgreSQL is ready"; \
			break; \
		fi; \
		sleep 2; \
		elapsed=$$((elapsed+2)); \
		echo "Waiting for PostgreSQL... ($$elapsed/$$timeout seconds)"; \
	done; \
	if [ $$elapsed -ge $$timeout ]; then \
		echo "PostgreSQL failed to become healthy after $$timeout seconds"; \
		exit 1; \
	fi
	@echo "Waiting for MongoDB to be healthy..."
	@timeout=60; elapsed=0; \
	while [ $$elapsed -lt $$timeout ]; do \
		if docker compose ps mongodb | grep -q "healthy"; then \
			echo "✓ MongoDB is ready"; \
			break; \
		fi; \
		sleep 2; \
		elapsed=$$((elapsed+2)); \
		echo "Waiting for MongoDB... ($$elapsed/$$timeout seconds)"; \
	done; \
	if [ $$elapsed -ge $$timeout ]; then \
		echo "MongoDB failed to become healthy after $$timeout seconds"; \
		exit 1; \
	fi
	@echo "Waiting for backend services to initialize..."
	@sleep 10
	@echo "✓ All services are ready"

# Run setup script
setup:
	@echo "Running setup script..."
	@bash scripts/setup.sh

# Stop all services
down:
	@echo "Stopping services..."
	@docker compose down

# Restart services
restart: down up

# View logs
logs:
	@docker compose logs -f

# View logs for specific service
logs-%:
	@docker compose logs -f $(subst logs-,,$@)

# Build without starting
build: check-env build-services

# Clean everything (removes volumes and data)
clean:
	@echo "Stopping services and removing volumes..."
	@docker compose down -v
	@echo "Removing any orphaned containers..."
	@for container in postgres mongodb userservice teamservice taskservice frontend mongo-express; do \
		docker rm -f $$container 2>/dev/null || true; \
	done
	@echo "✓ Cleaned up volumes and containers"

