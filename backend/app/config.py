import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Based Microplastic Monitoring System"
    API_V1_STR: str = "/api/v1"
    
    # Database configuration (defaults to SQLite locally, overridden by env var in Docker)
    DATABASE_URL: str = "sqlite:///./microplastic.db"

    # Provisional Concentration Thresholds (particles per liter)
    LOW_CONCENTRATION_THRESHOLD: float = 10.0
    HIGH_CONCENTRATION_THRESHOLD: float = 50.0

    # Detection & Optical Defaults
    DEFAULT_CONFIDENCE_THRESHOLD: float = 0.50
    DEFAULT_PIXEL_SCALE_UM: float = 1.25

    # Storage Paths
    STATIC_DIR: str = str(BASE_DIR / "static")
    UPLOAD_DIR: str = str(BASE_DIR / "static" / "uploads")
    DEMO_DIR: str = str(BASE_DIR / "static" / "demo_samples")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.DEMO_DIR, exist_ok=True)

