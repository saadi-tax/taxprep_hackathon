from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    app: str
    version: str
    environment: str
    timestamp: datetime


@router.get("/healthz", response_model=HealthResponse, tags=["health"])
async def healthcheck() -> HealthResponse:
    """Liveness/readiness probe."""

    return HealthResponse(
        status="ok",
        app=settings.app_name,
        version=settings.version,
        environment=settings.environment,
        timestamp=datetime.now(tz=timezone.utc),
    )

