"""
Microscope Image Analysis & Detection API Endpoints
"""

import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.schemas.domain import AnalysisResultResponse, SampleCreate
from app.services.sample_service import SampleService
from app.services.detection_service import detection_service
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analysis", tags=["Analysis"])

@router.post("/upload", response_model=AnalysisResultResponse, status_code=status.HTTP_201_CREATED, summary="Upload microscope image and run microplastic detection")
async def analyze_image_upload(
    file: UploadFile = File(..., description="Microscope image (PNG, JPEG, TIFF)"),
    sample_code: str = Form(..., description="Sample identifier code"),
    volume_ml: float = Form(..., gt=0.0, description="Water sample volume in mL"),
    location: Optional[str] = Form(None, description="Water collection location"),
    notes: Optional[str] = Form(None, description="Sampling notes"),
    optical_magnification: Optional[str] = Form("10x", description="Microscope objective magnification (4x, 10x, 20x, 40x, 100x)"),
    confidence_threshold: Optional[float] = Form(0.50, ge=0.1, le=1.0, description="Detection confidence threshold"),
    db: Session = Depends(get_db)
):
    # Verify file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Supported formats: PNG, JPEG, TIFF, BMP"
        )

    # Find or auto-create Sample
    sample = SampleService.get_sample_by_code(db, sample_code)
    if not sample:
        sample = SampleService.create_sample(
            db,
            SampleCreate(
                sample_code=sample_code,
                volume_ml=volume_ml,
                location=location,
                notes=notes
            )
        )
    else:
        # Update volume if provided
        sample.volume_ml = volume_ml
        if location and not sample.location:
            sample.location = location
        db.commit()

    # Read image contents
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty"
        )

    try:
        analysis_record = detection_service.process_and_save_analysis(
            db=db,
            sample=sample,
            image_bytes=image_bytes,
            original_filename=file.filename,
            optical_magnification=optical_magnification,
            confidence_threshold=confidence_threshold
        )
        return analysis_record
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Detection pipeline error: {str(e)}"
        )


@router.post("/analyze-demo", response_model=AnalysisResultResponse, status_code=status.HTTP_201_CREATED, summary="Run detection on a preloaded demo microscope sample")
def analyze_demo_sample(
    demo_name: str = Query(..., description="Demo sample filename identifier"),
    sample_code: Optional[str] = Query(None, description="Optional custom sample code"),
    volume_ml: Optional[float] = Query(500.0, gt=0.0, description="Sample volume in mL"),
    optical_magnification: Optional[str] = Query("10x", description="Optical magnification"),
    confidence_threshold: Optional[float] = Query(0.50, ge=0.1, le=1.0),
    db: Session = Depends(get_db)
):
    demo_file = f"{demo_name}.png" if not demo_name.endswith(".png") else demo_name
    demo_path = os.path.join(settings.DEMO_DIR, demo_file)

    if not os.path.exists(demo_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Demo sample '{demo_file}' not found in demo library"
        )

    code = sample_code or f"DEMO-{demo_name.upper()[:12]}"
    sample = SampleService.get_sample_by_code(db, code)
    if not sample:
        sample = SampleService.create_sample(
            db,
            SampleCreate(
                sample_code=code,
                volume_ml=volume_ml or 500.0,
                location="Demo Laboratory Feed",
                notes="Automated analysis run on curated benchmark demo microscope sample"
            )
        )

    with open(demo_path, "rb") as f:
        image_bytes = f.read()

    analysis_record = detection_service.process_and_save_analysis(
        db=db,
        sample=sample,
        image_bytes=image_bytes,
        original_filename=demo_file,
        optical_magnification=optical_magnification,
        confidence_threshold=confidence_threshold
    )
    return analysis_record


@router.get("", response_model=List[AnalysisResultResponse], summary="List all microscope analyses")
def list_analyses(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    sample_id: Optional[int] = Query(None, description="Filter by sample ID"),
    contamination_level: Optional[str] = Query(None, description="Filter by risk level: LOW, MODERATE, HIGH"),
    db: Session = Depends(get_db)
):
    return AnalyticsService.get_analyses(
        db,
        skip=skip,
        limit=limit,
        sample_id=sample_id,
        contamination_level=contamination_level
    )


@router.get("/{analysis_id}", response_model=AnalysisResultResponse, summary="Get detailed analysis result")
def get_analysis_detail(analysis_id: int, db: Session = Depends(get_db)):
    analysis = AnalyticsService.get_analysis_by_id(db, analysis_id)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis with ID {analysis_id} not found"
        )
    return analysis


@router.delete("/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete analysis result")
def delete_analysis(analysis_id: int, db: Session = Depends(get_db)):
    deleted = AnalyticsService.delete_analysis(db, analysis_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis with ID {analysis_id} not found"
        )
    return None


@router.get("/{analysis_id}/report", summary="Download analysis laboratory audit report")
def download_analysis_report(
    analysis_id: int,
    format: str = Query("json", pattern="^(json|csv)$"),
    db: Session = Depends(get_db)
):
    analysis = AnalyticsService.get_analysis_by_id(db, analysis_id)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis with ID {analysis_id} not found"
        )

    if format == "csv":
        # Generate CSV formatted particle log
        lines = [
            "Particle_ID,Type,Confidence,Size_um,X_min,Y_min,X_max,Y_max"
        ]
        for p in analysis.particles:
            lines.append(f"{p.id},{p.particle_type},{p.confidence},{p.size_um},{p.x_min},{p.y_min},{p.x_max},{p.y_max}")
        csv_data = "\n".join(lines)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=report_sample_{analysis.sample.sample_code}.csv"}
        )

    # JSON report
    report = {
        "report_id": f"REP-{analysis.id:05d}",
        "timestamp": analysis.created_at.isoformat(),
        "sample": {
            "id": analysis.sample.id,
            "sample_code": analysis.sample.sample_code,
            "volume_ml": analysis.sample.volume_ml,
            "location": analysis.sample.location,
            "notes": analysis.sample.notes
        },
        "results": {
            "total_particle_count": analysis.total_particle_count,
            "concentration_particles_per_liter": analysis.concentration_particles_per_liter,
            "contamination_level": analysis.contamination_level,
            "status": analysis.status
        },
        "regulatory_thresholds": {
            "low_threshold": settings.LOW_CONCENTRATION_THRESHOLD,
            "high_threshold": settings.HIGH_CONCENTRATION_THRESHOLD,
            "standard": "Provisional Environmental Setting"
        },
        "image_metadata": {
            "file_name": analysis.image_metadata.file_name if analysis.image_metadata else None,
            "width": analysis.image_metadata.width if analysis.image_metadata else None,
            "height": analysis.image_metadata.height if analysis.image_metadata else None
        },
        "particles": [
            {
                "id": p.id,
                "type": p.particle_type,
                "confidence": p.confidence,
                "size_um": p.size_um,
                "bbox": [p.x_min, p.y_min, p.x_max, p.y_max]
            }
            for p in analysis.particles
        ]
    }
    return JSONResponse(content=report)
