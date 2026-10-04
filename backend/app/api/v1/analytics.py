"""
Analytics Dashboard Summary API Endpoints
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.domain import AnalyticsSummaryResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/summary", response_model=AnalyticsSummaryResponse, summary="Get high-level dashboard metrics and aggregations")
def get_analytics_summary(db: Session = Depends(get_db)):
    return AnalyticsService.get_summary(db)
