import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "StudySphere"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "studysphere-super-secret-jwt-signing-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://studysphere-ruddy.vercel.app",
    ]

    # Database
    # Default to sqlite for local zero-config, or postgresql via env
    DATABASE_URL: str = "sqlite:///./studysphere.db"

    # Private file storage
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: Path = BASE_DIR / "storage" / "uploads"
    MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB

    # Nexconn SDK integration
    # Public App Key can be shared with clients; App Secret MUST stay on backend
    NEXCONN_APP_KEY: str = "studysphere_app_key_placeholder"
    NEXCONN_APP_SECRET: str = "studysphere_app_secret_placeholder"
    NEXCONN_BASE_URL: str = "https://api.sg-light-api.com"
    NEXCONN_MOCK_FALLBACK: bool = True  # Allows offline/dev testing when external credentials are placeholders

    # AI Tutor (Ollama)
    OLLAMA_URL: str = "http://127.0.0.1:11434/api/chat"
    OLLAMA_MODEL: str = "qwen3:0.6b"
    AI_TIMEOUT_SECONDS: float = 30.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
