# Coding Agent Playbook

This guide defines how autonomous coding agents should interact with the TaxGPT repository. Follow these steps to keep the human team informed and the repo healthy.

## 1. Before you start
- **Sync context**: Read `PLAN.md`, `docs/REPO_STRUCTURE.md`, and any open issues referenced in the task.
- **Activate environments**:
  - `pyenv activate taxgpt-backend` before running any Python/uv commands.
  - Run `pnpm install` in `frontend/` if Node deps are missing.
- **Update TODOs**: If a plan references todo items, mark the relevant one `in_progress` before editing files.

## 2. Allowed tools & commands
- Prefer repo tooling:
  - `make bootstrap`, `make dev`, `make lint`, `make test`
  - `uv run <command>` inside `backend/`
  - `pnpm <command>` inside `frontend/`
- Use `read_file`, `grep`, and other read-only tools for inspection whenever possible.
- Only run shell commands through the provided terminal interface; never execute external network calls without explicit approval.

## 3. Editing workflow
1. **Plan** – confirm scope with the user if ambiguous; reference PLAN.md for existing context.
2. **Modify** – use `apply_patch` or appropriate editors; keep commits granular (the human team will handle final git commits).
3. **Self-verify** – run `make lint test` or the minimal scope (backend/frontend) affected.
4. **Document** – update relevant markdown files (PLAN, docs, README) when behavior, architecture, or workflows change.
5. **Summarize** – in your final response, list:
   - Changes made (files + intent)
   - Tests executed (or why not)
   - Follow-up actions or risks

## 4. Branching & naming
- Follow branch naming conventions from `docs/CODING_STANDARDS.md`.
- Reference ticket IDs when provided (e.g., `feat/doc-indexing-1234`).
- Mention any migrations or breaking changes prominently in PR summaries.

## 5. Testing expectations
| Change type | Required command(s) |
| --- | --- |
| Backend logic | `cd backend && uv run pytest` and `uv run ruff check` |
| Frontend UI/logic | `cd frontend && pnpm lint && pnpm test` |
| Full-stack / infra | `make lint test` and, if changed, `docker compose config` to validate YAML |

If tests cannot be run (missing dependency, environment constraint), explain why and list steps for the human operator to reproduce later.

## 6. Documentation requirements
- **PLAN.md** must stay current with roadmap, API changes, and risk mitigation updates.
- **docs/REPO_STRUCTURE.md** must be updated if you add/move directories.
- **docs/CODING_STANDARDS.md** must change if lint/test requirements are updated.
- **docs/AGENT_PLAYBOOK.md** (this file) should be edited if tooling expectations shift.

## 7. Quality & safety checks
- Never commit secrets, credentials, or sample data containing PII.
- Log sensitive operations with care; redact tokens and account numbers.
- Rollbar/Sentry instrumentation should be documented in PLAN.md when touched.
- Keep changes deterministic; seed random operations and pin dependency versions.

## 8. Handoff protocol
- Ensure TODO statuses are accurate (`completed` when a task is fully addressed).
- Provide reproduction steps for bug fixes.
- Link screenshots or console output (when relevant) via markdown in PR descriptions or final summaries.

Following this playbook ensures agents remain predictable collaborators and accelerates review for the human team. Deviations should be explicitly approved by the user owning the repository.

