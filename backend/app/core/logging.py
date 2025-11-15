import logging
from logging.config import dictConfig

from app.core.config import settings


def configure_logging() -> None:
    """Configure structured logging for the FastAPI app."""

    log_level = settings.log_level
    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "filters": {
                "trace_id": {
                    "()": "app.core.logging.TraceIdFilter",
                },
            },
            "formatters": {
                "json": {
                    "format": (
                        "%(asctime)s %(name)s %(levelname)s "
                        "%(message)s trace_id=%(trace_id)s"
                    ),
                },
            },
            "handlers": {
                "default": {
                    "class": "logging.StreamHandler",
                    "formatter": "json",
                    "filters": ["trace_id"],
                },
            },
            "loggers": {
                "": {
                    "handlers": ["default"],
                    "level": log_level,
                },
                "uvicorn.error": {
                    "handlers": ["default"],
                    "level": log_level,
                    "propagate": False,
                },
                "uvicorn.access": {
                    "handlers": ["default"],
                    "level": log_level,
                    "propagate": False,
                },
            },
        }
    )


class TraceIdFilter(logging.Filter):
    """Inject a trace identifier into log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "trace_id"):
            record.trace_id = "-"
        return True

