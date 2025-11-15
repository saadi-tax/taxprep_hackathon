# TaxGPT Hackathon Architecture & Delivery Plan

_Last updated: 2025-11-15_

## 0. Mission & Constraints
- **Goal**: Ship an agent-friendly monorepo that ingests raw tax documents, orchestrates AI extraction, and delivers a CPA-reviewable Form 1040 workflow (web UI + API).
- **Team shape**: 2 engineers + coding agents; must enable parallel frontend/backend work with minimal coupling.
- **Non-negotiables**: Determinism, rapid local setup (<5 min), detailed traceability (document lineage, workpapers), and documentation suitable for both humans and autonomous agents.

## 1. System Architecture Overview
```
┌──────────────┐     HTTPS/WebSocket     ┌────────────────────────┐
│ React Client │  <------------------->  │ FastAPI Backend (uv)   │
└─────▲────────┘                         │  • API / Webhooks      │
      │                                  │  • Task queue adapters │
      │ GraphQL/REST soon                │  • Doc processing svc  │
┌─────┴────────┐     Async jobs (RQ)     │  • ProConnect bridge   │
│ Document svc │  <--------------------> │                        │
└──────────────┘                         └───────────▲────────────┘
                    ┌──────────────┐                │
                    │ Postgres     │<───────────────┘
                    │  • doc idx   │
                    │  • extracted │
                    │    entities  │
                    └──────────────┘
```

### Key flows
1. **Upload → Classification**: Client uploads via pre-signed URL ➜ backend notifies document service ➜ doc classified, text extracted (Reducto/Anthropic).
2. **Extraction → Workpapers**: Structured data normalized into domain models (W2, 1099, Schedule C) ➜ stored in Postgres ➜ workpaper generator builds summaries.
3. **Return Assembly**: Backend emits deterministic JSON ready for ProConnect automation; UI visualizes lineage + allows overrides.

## 2. Technology Decisions
| Layer | Choice | Rationale |
| --- | --- | --- |
| Frontend | React 18 + Vite + TypeScript | Fast DX, excellent HMR, broad AI-agent support. |
| State/Data | TanStack Query (server state), Zustand (local), React Router | Clear separation of concerns; hooks-friendly. |
| Styling | Tailwind + Radix UI + shadcn/ui scaffold | Rapid component composition + accessibility. |
| Backend | FastAPI (Python 3.11 via `uv`) | Async-first, OpenAPI-native, easy for agents to extend. |
| ORM/DB | SQLModel (Pydantic v2) atop Postgres 15 | Declarative models share schemas with API payloads. |
| Task Queue (phase 2+) | RQ/Celery (Redis) | Offload long-running extraction tasks. |
| Messaging | Pydantic Settings + Redis pub/sub for progress | Keeps UI reactive without tight coupling. |
| Testing | pytest, coverage, hypothesis; Vitest + Testing Library | Deterministic coverage on both stacks. |
| Tooling | Ruff, Black, isort, mypy, Prettier, ESLint, Stylelint | Enforced via pre-commit + CI. |

Alternatives considered (Next.js, Node backend, Django) were rejected for slower cold-starts or heavier scaffolding; Vite/FastAPI hits the hackathon sweet spot while remaining scalable.

## 3. Repository Layout (authoritative)
```
.
├── backend/
│   ├── app/
│   │   ├── api/             # routers, deps, DTOs
│   │   ├── core/            # config, logging, security
│   │   ├── models/          # SQLModel entities
│   │   ├── schemas/         # Pydantic response/request models
│   │   ├── services/        # doc ingestion, workpapers, LLM clients
│   │   └── main.py
│   ├── tests/
│   ├── pyproject.toml
│   ├── uv.lock / poetry.lock
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── app/             # route-level layout
│   │   ├── components/
│   │   ├── features/
│   │   ├── lib/             # API clients, utils
│   │   ├── pages/
│   │   └── styles/
│   ├── public/
│   ├── package.json / pnpm-lock.yaml
│   └── README.md
├── infrastructure/
│   ├── docker/
│   │   ├── backend.Dockerfile
│   │   └── frontend.Dockerfile
│   ├── docker-compose.yml
│   └── scripts/
├── docs/
│   ├── REPO_STRUCTURE.md
│   ├── CODING_STANDARDS.md
│   ├── AGENT_PLAYBOOK.md
│   └── ADR/
├── .editorconfig
├── .gitignore
├── .pre-commit-config.yaml
├── Makefile
├── README.md
└── PLAN.md (this file)
```

## 4. Backend Blueprint
### API surface (v0)
- `GET /healthz` – readiness & dependency checks.
- `POST /api/v1/uploads/policy` – returns presigned URL metadata.
- `POST /api/v1/documents` – register uploaded file, trigger classification.
- `GET /api/v1/documents/{id}` – fetch doc metadata + extraction status.
- `POST /api/v1/returns/assemble` – compile return snapshot.
- `GET /api/v1/returns/{id}` – view assembled return with lineage.
- `POST /api/v1/workpapers/refresh` – regenerate summaries.

### Modules
- `core.config`: environment loading (pyenv `taxgpt-backend`, `.env` layering), typed settings, feature flags.
- `core.logging`: structlog JSON logs, request IDs, correlation tokens.
- `api.dependencies`: DB session, Service containers, Auth (API key for hackathon, OAuth later).
- `services.documents`: integrates Reducto/Roboflow/LLM; multi-pass pipeline and confidence scoring.
- `services.proconnect`: placeholder interface for automation script.
- `models.*`: SQLModel definitions (Document, ExtractionJob, Workpaper, ReturnSnapshot, AuditTrail).
- `schemas.*`: mirrored Pydantic models for API responses.
- `tests/`: fixtures for async client, snapshot of sample docs; property tests for calculators.

### Observability
- Middleware for timing + structured logs.
- OpenTelemetry exporters optional (phase 3).
- Rollbar/Sentry hook (documented in docs, integrate once keys available).

## 5. Frontend Blueprint
### Key routes
- `/` Dashboard – list of taxpayers, import actions.
- `/case/:id` – three-panel workspace (documents, chat, outputs).
- `/case/:id/doc/:docId` – dedicated document viewer with bounding boxes.
- `/settings` – API keys, ProConnect creds.

### State/Data
- React Query: caches API calls, auto-refetch on focus.
- Zustand slices: UI preferences, panel layout, ephemeral chat drafts.
- EventSource/WebSocket hook: updates extraction progress.

### Utility layers
- `lib/api/client.ts`: generated from OpenAPI via `@hey-api/openapi-ts`.
- `lib/workpapers.ts`: helpers to shape data for UI.
- `components/ui/…`: shadcn wrappers for consistent design.
- `test-utils`: custom render w/ providers.

### Testing & Quality
- Vitest + Testing Library + MSW for API mocks.
- Storybook-ready structure (phase 2) for document viewer and workpaper components.
- ESLint config extends `@tanstack/eslint-plugin-query`, React hooks, accessibility.

## 6. Shared Development Experience
- **Package managers**: pnpm for frontend (faster installs); `uv` (or Poetry) for backend pinned to Python 3.11. Ensure `pyenv activate taxgpt-backend` before dependency commands.
- **Make targets**:
  - `make bootstrap` → installs toolchain + git hooks.
  - `make dev` → runs backend + frontend concurrently (uses tmux or `npm-run-all` equivalent).
  - `make lint`, `make test`, `make format`.
- **Docker**: Compose spins Postgres, Redis, backend, frontend for parity; volumes for hot reload.
- **CI**: GitHub Actions with matrix (py versions, node versions). Steps: checkout, setup pnpm, run lint/test; upload coverage to Codecov placeholder.
- **VS Code**: `.vscode/extensions.json` recommending Python, Ruff, ESLint, Tailwind, Thunder Client.

## 7. Data & Storage
- **Primary DB**: Postgres schema `taxgpt`.
  - Tables: `documents`, `extractions`, `workpapers`, `returns`, `audit_events`.
  - Migrations: Alembic autop-run via `alembic revision --autogenerate`.
- **Object storage**: S3-compatible bucket (localstack in dev) referenced via presigned URLs.
- **Secrets**: `.env` (local), `.env.template`. Use Doppler/1Password for prod.

## 8. Implementation Phases
1. **Phase 0 – Repo bootstrap (today)**  
   Create skeleton, tooling, documentation, healthcheck endpoints, stub UI.
2. **Phase 1 – Document ingestion loop**  
   File upload UI, backend classification stub, Postgres migrations, list view.
3. **Phase 2 – Extraction + Workpapers**  
   Integrate LLM services, produce workpapers, highlight bounding boxes, add Redis queue.
4. **Phase 3 – Return assembly + ProConnect automation**  
   Map normalized data to 1040 schema, implement conversational overrides, finalize CI/CD.
5. **Phase 4 – Hardening & polish**  
   Determinism testing harness, Rollbar instrumentation, advanced user stories (duplicate detection, ratios).

## 9. Risks & Mitigations
- **Document variability** → use schema detection w/ fallback manual entry; log low-confidence extractions for review.
- **Agent collaboration drift** → enforce AGENT_PLAYBOOK rules (branch naming, tests, doc updates) + pre-commit.
- **Toolchain mismatches** → `.tool-versions` + Makefile wrappers ensure consistent Python/Node versions.
- **Performance** → background tasks + streaming progress updates; avoid blocking FastAPI threads.
- **Security** → API key auth for hackathon, ready path to JWT/OIDC; sanitized logging.
- **Time compression** → defer heavy UI polish; focus on deterministic pipelines + clear docs.

## 10. Next Actions
1. Materialize repo skeleton + configs (shared tooling).  
2. Scaffold backend + frontend foundations per sections 4 & 5.  
3. Populate docs (`REPO_STRUCTURE`, `CODING_STANDARDS`, `AGENT_PLAYBOOK`) and root README.  
4. Iterate on service-specific features per phases.

