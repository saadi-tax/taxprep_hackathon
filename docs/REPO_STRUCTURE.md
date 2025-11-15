# Repository Structure & Ownership

This document is the authoritative map for the TaxGPT hackathon monorepo. Use it to quickly understand where code lives, which team owns each area, and how to extend the system without stepping on other workflows.

## Top-level layout
```
.
├── backend/           # FastAPI service (Python 3.11, uv)
├── frontend/          # React + Vite (TypeScript, pnpm)
├── infrastructure/    # Dockerfiles and infra scripts
├── docs/              # Repo standards, agent playbooks, ADRs
├── PLAN.md            # Architecture + delivery phases
├── README.md          # Quick start + workflows
├── Makefile           # Shared developer tasks
├── docker-compose.yml # Local orchestration for db/redis/app
└── .github/workflows  # CI pipelines
```

## Service ownership
| Path | Purpose | DRIs / Notes |
| --- | --- | --- |
| `backend/app` | API entrypoint, document ingestion, workpaper services | Backend team |
| `backend/tests` | pytest suites, fixtures | Backend + QA |
| `frontend/src` | React workspace, routing, features | Frontend team |
| `infrastructure/docker` | Container images for prod/dev parity | Shared |
| `docs/*` | Standards and onboarding; must be updated with any behavioral change | Everyone (PR gate) |

## Backend layout
```
backend/
├── app/
│   ├── api/          # Routers + dependencies
│   ├── core/         # Config, logging, middleware
│   ├── models/       # SQLModel entities
│   ├── schemas/      # Pydantic DTOs
│   ├── services/     # Business logic, integrations
│   └── main.py       # FastAPI factory
├── env.example       # Copy to .env before running
├── pyproject.toml    # uv/poetry metadata + tooling config
├── README.md
└── tests/            # Async client tests, fixtures
```

## Frontend layout
```
frontend/
├── src/
│   ├── app/          # Routing + app shell
│   ├── components/   # Shared UI primitives/layout
│   ├── features/     # Domain-specific slices (documents, workpapers, etc.)
│   ├── lib/          # API clients, hooks, utilities
│   ├── styles/       # Tailwind + global CSS
│   └── test/         # Vitest setup utilities
├── env.example       # Copy to .env for VITE_*
├── package.json      # pnpm scripts + deps
├── tsconfig*.json    # TS project references
├── vite.config.ts
└── README.md
```

## Automation & tooling
- `Makefile` – canonical entrypoint for install, lint, test, dev servers, and Docker orchestration.
- `.pre-commit-config.yaml` – enforces Ruff/Black/isort/mypy/Prettier before commits. Install via `pre-commit install`.
- `.github/workflows/ci.yml` – split backend/frontend jobs to keep failures localized.
- `.editorconfig` – shared formatting baseline (2 spaces JS/TS, 4 spaces Python).

## Infrastructure
- `docker-compose.yml` orchestrates Postgres, Redis, backend, and frontend for smoke testing.
- `infrastructure/docker/backend.Dockerfile` – pip installs backend as a package; mounts source for hot reload.
- `infrastructure/docker/frontend.Dockerfile` – pnpm dev server container with env overrides.

## Documents & decision records
- `docs/REPO_STRUCTURE.md` (this file) – layout + ownership (update whenever structure changes).
- `docs/CODING_STANDARDS.md` – style guide, testing expectations, PR checklist.
- `docs/AGENT_PLAYBOOK.md` – how coding agents should interact with the repo, branching, and tooling.
- `docs/ADR/` – drop Architecture Decision Records when making significant tradeoffs. Use numbering `ADR-YYYYMMDD-<topic>.md`.

## Extension points
- `backend/app/services/` is intentionally modular; add new services (LLM providers, workpaper builders) behind clear interfaces.
- `frontend/src/features/` should encapsulate UI + hooks per domain to minimize cross-talk.
- Shared TypeScript utilities belong in `frontend/src/lib` and should never import from features to avoid cycles.

Keep this document updated as the repository evolves. Changes to ownership or layout require a PR touching this file plus PLAN.md.

