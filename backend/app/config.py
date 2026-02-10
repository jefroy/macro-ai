from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Look for .env in CWD first, then project root (parent of backend/)
_env_file = Path(".env")
if not _env_file.exists():
    _env_file = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_env_file), env_file_encoding="utf-8", extra="ignore"
    )

    # App
    app_name: str = "MacroAI"
    debug: bool = False
    secret_key: str = "change-me-in-production"

    # Database
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_database: str = "macroai"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Auth
    jwt_algorithm: str = "HS256"
    jwt_access_expiry_minutes: int = 30
    jwt_refresh_expiry_days: int = 7

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    # Mode
    single_user_mode: bool = False


settings = Settings()
