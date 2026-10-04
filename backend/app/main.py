from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import engine, Base
from app.api.v1 import api_v1_router
# Ensure models are imported so Base metadata knows about them
import app.models  # noqa: F401

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema tables on startup
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning: Database initialization on startup deferred or failed: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Based Microplastic Monitoring System REST API — End-to-End Production Ready",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory for raw and annotated images
app.mount("/static", StaticFiles(directory=settings.STATIC_DIR), name="static")

# Root level health endpoint
@app.get("/health", tags=["Health"], summary="Root Health Check")
def root_health():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ai_model_integrated": True
    }

# Include v1 API routes
app.include_router(api_v1_router, prefix=settings.API_V1_STR)

