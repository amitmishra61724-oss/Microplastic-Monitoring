"""
Demo Sample Library API Endpoints
"""

import os
import json
from pathlib import Path
from typing import List
from fastapi import APIRouter
from app.config import settings
from app.schemas.domain import DemoSampleResponse

router = APIRouter(prefix="/demo", tags=["Demo"])

@router.get("/samples", response_model=List[DemoSampleResponse], summary="List available benchmark microscope test images")
def get_demo_samples():
    demo_dir = Path(settings.DEMO_DIR)
    results = []
    if not demo_dir.exists():
        return results

    meta_files = list(demo_dir.glob("*.json"))
    for mf in meta_files:
        try:
            with open(mf, "r") as f:
                data = json.load(f)
                results.append(DemoSampleResponse(
                    name=data.get("name", mf.stem),
                    display_name=data.get("display_name", mf.stem.replace("_", " ").title()),
                    image_url=f"/static/demo_samples/{data.get('image_file', mf.stem + '.png')}",
                    recommended_volume_ml=data.get("recommended_volume_ml", 500.0),
                    ground_truth_particle_count=data.get("ground_truth_particle_count", 0),
                    ground_truth_concentration_particles_l=data.get("ground_truth_concentration_particles_l", 0.0),
                    ground_truth_level=data.get("ground_truth_level", "MODERATE")
                ))
        except Exception:
            continue

    return results
