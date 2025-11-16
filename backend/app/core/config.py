from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="TAXGPT_",
        extra="ignore",
    )

    app_name: str = "TaxGPT API"
    version: str = "0.1.0"
    environment: Literal["local", "development", "staging", "production"] = "local"
    debug: bool = True
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    api_prefix: str = "/api/v1"
    database_url: str = Field(
        default="postgresql+psycopg://taxgpt:taxgpt@localhost:5432/taxgpt",
        description="SQLModel/SQLAlchemy compatible database URI.",
    )
    allow_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        description="CORS origin whitelist.",
    )
    openai_api_key: str = Field(
        default="",
        description="OpenAI API key for document extraction.",
    )

    @field_validator("allow_origins", mode="before")
    @classmethod
    def split_allow_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached application settings."""

    return Settings()


settings = get_settings()

