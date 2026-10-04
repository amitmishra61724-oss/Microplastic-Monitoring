from datetime import datetime, timezone
from fastapi import APIRouter
from app.config import settings

router = APIRouter()

@router.get("/health", summary="API v1 Health Check")
def get_v1_health():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ai_model_integrated": True,
        "provisional_thresholds": {
            "low": settings.LOW_CONCENTRATION_THRESHOLD,
            "high": settings.HIGH_CONCENTRATION_THRESHOLD,
            "scientific_validation": "provisional_placeholder"
        }
    }

