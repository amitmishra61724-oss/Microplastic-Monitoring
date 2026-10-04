from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.samples import router as samples_router
from app.api.v1.analysis import router as analysis_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.demo import router as demo_router

api_v1_router = APIRouter()
api_v1_router.include_router(health_router, tags=["Health"])
api_v1_router.include_router(samples_router)
api_v1_router.include_router(analysis_router)
api_v1_router.include_router(analytics_router)
api_v1_router.include_router(demo_router)

