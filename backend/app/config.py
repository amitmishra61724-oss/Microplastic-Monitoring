from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Based Microplastic Monitoring System"
    API_V1_STR: str = "/api/v1"
    
    # Database configuration
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/microplastic_db"

    # Provisional Concentration Thresholds (particles per liter)
    # WARNING: These threshold values are provisional configuration placeholders.
    # They have NOT been scientifically validated against official regulatory standards.
    LOW_CONCENTRATION_THRESHOLD: float = 10.0
    HIGH_CONCENTRATION_THRESHOLD: float = 50.0

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
