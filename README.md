# TaxGPT Hackathon Workspace

Monorepo containing a Vite + React workspace and FastAPI backend for the internal TaxGPT hackathon. The repository is optimized for rapid iteration, deterministic agent collaboration, and clear domain boundaries so teammates can work in parallel without blocking each other.

## Quick start
1. **Clone** and install prerequisites (Python 3.11 via `pyenv`, Node 20+, pnpm 9+, Docker if needed).
2. **Activate Python env** (per team standard): `pyenv activate taxgpt-backend`.
3. **Bootstrap tooling**
   ```bash
   cd /Volumes/ExtStorage/TaxGPT\ fun/taxprep_hackathon
   make bootstrap
   ```
4. **Start dev servers** (in one terminal)
   ```bash
   make dev
   ```
   - Backend → http://localhost:8000/docs  
   - Frontend → http://localhost:5173 (points to backend via `VITE_API_URL`)

If you prefer Docker parity, run `make docker-up` which provisions Postgres, Redis, backend, and frontend containers.

## Repository layout
```
.
├── backend/          # FastAPI service (uv)
├── frontend/         # Vite + React (pnpm)
├── infrastructure/   # Dockerfiles, compose assets
├── docs/             # Repo map, coding standards, agent playbook
├── PLAN.md           # Detailed architecture & roadmap
├── Makefile          # Unified dev workflows
└── docker-compose.yml
```

Each service also contains its own README with stack-specific instructions.

## Common workflows
| Task | Command |
| --- | --- |
| Install dependencies | `make bootstrap` |
| Run both dev servers | `make dev` (Ctrl+C stops both) |
| Backend only | `make dev-backend` |
| Frontend only | `make dev-frontend` |
| Run tests | `make test` |
| Run linters/formatters | `make lint` / `make format` |
| Launch Docker stack | `make docker-up` / `make docker-down` |


## Collaboration guardrails
- Keep `PLAN.md` up to date with architecture decisions and implementation phases.
- Always run `make lint test` before pushing or handing off to a coding agent.
- Use feature branches named `feat/<area>-<short-desc>`; open PRs with checklists from `docs/CODING_STANDARDS.md`.
- Coding agents should consult `docs/AGENT_PLAYBOOK.md` for expectations on tooling, testing, and documentation updates.

## Troubleshooting
- **Ports already in use**: Adjust `VITE_API_URL`, `UVICORN_PORT`, or Docker compose overrides via `.env`.
- **Slow installs**: Use `uv` for backend dependencies and `pnpm fetch` to warm caches before `pnpm install`.
- **CORS issues**: Update `TAXGPT_ALLOW_ORIGINS` in backend `.env`.

For additional design details, component ownership, and roadmap, read `PLAN.md` and the documents under `docs/`.