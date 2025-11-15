# TaxGPT Backend

FastAPI service that ingests tax documents, orchestrates extraction pipelines, and exposes APIs for the web workspace.

## Prerequisites
- Python 3.11 (manage via `pyenv`; activate with `pyenv activate taxgpt-backend`)
- [uv](https://github.com/astral-sh/uv) or Poetry (uv preferred)
- PostgreSQL 15 (local or Docker)

## Setup
```bash
cd /Volumes/ExtStorage/TaxGPT\ fun/taxprep_hackathon/backend
pyenv activate taxgpt-backend
uv sync
cp env.example .env
```

## Key commands
| Command | Description |
| --- | --- |
| `uv run uvicorn app.main:app --reload` | Start local API server |
| `uv run pytest` | Run backend test suite |
| `uv run ruff check app tests` | Lint |
| `uv run black --check app tests` | Format check |
| `uv run mypy app` | Static type checking |

These commands are also exposed via the repo-level `Makefile`.

## Environment
`.env` is managed via `pydantic-settings`. For hackathon scenarios you likely only need:
```
TAXGPT_DATABASE_URL=postgresql+psycopg://taxgpt:taxgpt@localhost:5432/taxgpt
TAXGPT_ENVIRONMENT=local
TAXGPT_LOG_LEVEL=INFO
```

## Project anatomy
- `app/api` – routers, dependencies, DTOs
- `app/core` – shared config/logging/security
- `app/services` – document ingestion, ProConnect automation (future)
- `app/models` – SQLModel definitions
- `app/schemas` – Pydantic request/response models
- `tests/` – pytest suites (async aware)

## Next steps
- Implement document ingestion + storage adapters
- Wire Reducto/LLM services inside `app/services/documents.py`
- Introduce Alembic migrations and Postgres container
- Add authentication middleware once ProConnect integration solidifies

