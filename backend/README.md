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

## Document ingestion API
The FastAPI surface in `app/main.py` exposes a minimal ingestion loop backed by SQLite:

| Endpoint | Method | Notes |
| --- | --- | --- |
| `/api/documents/ingest` | `POST` | multipart form-data (`file` field) storing the PDF, text, and metadata |
| `/api/documents` | `GET` | optional `tax_year` / `doc_type` filters, returns `TaxDocumentMetadata[]` |
| `/api/documents/{id}` | `GET` | metadata lookup |
| `/api/documents/{id}/text` | `GET` | returns `{ id, full_text }` |
| `/api/documents/{id}/file` | `GET` | streams the persisted PDF |

All files are saved to `backend/app/uploads/` and metadata lives in `backend/app/taxdocs.db` (auto-created).

### Quick manual test
```bash
pyenv activate taxgpt-backend
uv run uvicorn app.main:app --reload
# in another shell
curl -F "file=@tax_documents/sample.pdf" http://localhost:8000/api/documents/ingest
curl http://localhost:8000/api/documents
```

## MCP over HTTP
The service also mounts a FastMCP server at `/mcp` with three tools:

| Tool | Input | Output |
| --- | --- | --- |
| `list_tax_documents` | `tax_year?: int`, `doc_type?: str` | `TaxDocumentMetadata[]` |
| `get_tax_document_metadata_tool` | `doc_id: str` | `TaxDocumentMetadata` |
| `get_tax_document_text_tool` | `doc_id: str` | `{ id: str, full_text: str }` |

Example invocation with the MCP CLI:
```bash
mcp call http://localhost:8000/mcp list_tax_documents
```

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

