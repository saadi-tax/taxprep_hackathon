SHELL := /bin/bash
UV ?= uv
PNPM ?= pnpm

.PHONY: bootstrap dev dev-backend dev-frontend lint test format docker-up docker-down

bootstrap:
	cd backend && $(UV) sync
	cd frontend && $(PNPM) install

dev-backend:
	cd backend && $(UV) run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && $(PNPM) dev

dev:
	@echo "Starting backend and frontend dev servers (Ctrl+C to stop)..."
	@set -euo pipefail; \
	backend_pid=""; \
	frontend_pid=""; \
	cleanup() { \
		code=$$?; \
		for pid in $$backend_pid $$frontend_pid; do \
			if [ -n "$$pid" ] && kill -0 $$pid 2>/dev/null; then \
				kill $$pid 2>/dev/null || true; \
			fi; \
		done; \
		wait $$backend_pid $$frontend_pid 2>/dev/null || true; \
		exit $$code; \
	}; \
	trap cleanup INT TERM EXIT; \
	$(MAKE) --no-print-directory dev-backend & \
	backend_pid=$$!; \
	$(MAKE) --no-print-directory dev-frontend & \
	frontend_pid=$$!; \
	wait $$backend_pid $$frontend_pid

lint:
	cd backend && $(UV) run ruff check app tests
	cd frontend && $(PNPM) lint

test:
	cd backend && $(UV) run pytest
	cd frontend && $(PNPM) test

format:
	cd backend && $(UV) run black app tests
	cd frontend && $(PNPM) format

docker-up:
	docker compose up --build

docker-down:
	docker compose down --remove-orphans

