# Coding Standards & Review Checklist

These conventions keep the TaxGPT hackathon repo consistent for humans and coding agents alike. Treat this file as the source of truth when writing code, opening PRs, or reviewing contributions.

## Core principles
1. **Determinism first** – prefer explicit configuration, pinned versions, and pure functions.
2. **Traceability** – every data transformation should point to its origin (document ID, workpaper, prior-year reference).
3. **Separation of concerns** – backend handles orchestration + persistence, frontend focuses on interaction/visualization.
4. **Docs stay in sync** – PLAN.md and the `docs/` folder must reflect any structural or behavioral change introduced by a PR.

## Python / FastAPI
- Follow PEP 8 with a 100-character limit (enforced via Ruff + Black).
- All new modules require type hints; `mypy` should pass with `--strict-optional`.
- Use `pydantic`/`SQLModel` dataclasses for schemas/entities instead of bare dicts.
- Handle async I/O with `async def` and `httpx.AsyncClient`.
- Configuration is centralized in `app/core/config.py`; new environment variables must include defaults + descriptions.
- Add tests under `backend/tests/` mirroring package paths; prefer `pytest.mark.asyncio` for coroutine tests.

## TypeScript / React
- Use function components + hooks; no class components.
- Organize code by feature inside `src/features/<domain>/`.
- Prefer TanStack Query for server data and Zustand for local UI state.
- Keep components presentational; move data fetching into hooks under `src/lib` or feature-specific hooks.
- Styling is Tailwind-first; extract reusable UI into `src/components`.
- Vitest is the unit-test runner; any new hook or complex component should have at least one test covering behavior.
- Run `pnpm lint` and `pnpm test` locally before pushing.

## Testing expectations
| Change type | Minimum tests |
| --- | --- |
| API route/service | pytest covering success + failure paths |
| React component/hook | Vitest + Testing Library assertions |
| Configuration/infra | Smoke test via `make dev` or Docker instructions noted in PR |

Snapshot tests are discouraged unless paired with semantic assertions.

## Commit & PR guidelines
- **Branch naming**: `feat/<area>-<summary>`, `fix/<bug>`, `chore/<task>`.
- **Commits**: small, descriptive, imperative mood (`feat: add healthcheck route`).
- **PR template** (include in description):
  - Summary of changes
  - Testing evidence (`make test`, manual steps)
  - PLAN.md/docs updates (if any)
  - Screenshots or logs for UI/backend behavior when relevant

## Review checklist
- [ ] Lint + tests pass locally (`make lint test`)
- [ ] PLAN.md or docs updated when architecture/flow changes
- [ ] No secrets, tokens, or PII committed
- [ ] Logging covers new critical paths (structured, no sensitive data)
- [ ] Errors handled gracefully (no bare `except`, no silent failures)
- [ ] Frontend accessible (semantic HTML, aria labels where needed)
- [ ] Backend endpoints documented via FastAPI schema/description
- [ ] Deterministic behavior (no random ordering without seeds)

## Tooling requirements
- Run `pre-commit install` once; hooks enforce formatting before code lands.
- Python dependencies managed via `uv sync`; always activate `pyenv activate taxgpt-backend` before running pip/uv commands.
- Frontend dependencies managed via `pnpm install` with lockfiles committed.

## When in doubt
- Document the decision in `docs/ADR/`.
- Update PLAN.md to capture roadmap impacts.
- Ask in `#hackathon` or leave a code comment that references follow-up work.

Consistency beats cleverness. Optimize for legibility so reviewers and agents can reason about changes quickly.

