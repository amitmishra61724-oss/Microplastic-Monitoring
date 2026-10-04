"""
Microplastic Detection and Image Processing Service
Orchestrates computer vision pipeline, particle classification,
concentration metrics calculation, and database persistence.
"""

import os
import sys
import uuid
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import cv2
import numpy as np
from sqlalchemy.orm import Session

# Add both backend dir and project root to sys.path so ml package is accessible everywhere
backend_dir = Path(__file__).resolve().parent.parent.parent
project_root = backend_dir.parent
for p in [str(backend_dir), str(project_root)]:
    if p not in sys.path:
        sys.path.insert(0, p)


from app.config import settings
from app.models.domain import Sample, AnalysisResult, DetectedParticle, ImageMetadata
from ml.models.detector import MicroplasticDetector

class DetectionService:
    def __init__(self):
        self.detector = MicroplasticDetector(
            confidence_threshold=settings.DEFAULT_CONFIDENCE_THRESHOLD,
            default_scale_um=settings.DEFAULT_PIXEL_SCALE_UM
        )

    def calculate_concentration(self, total_particles: int, volume_ml: float) -> float:
        """
        Formula: concentration (particles/L) = total_particle_count / (volume_ml / 1000)
        """
        if volume_ml <= 0:
            raise ValueError("Volume must be strictly positive")
        volume_liters = volume_ml / 1000.0
        return round(total_particles / volume_liters, 2)

    def classify_contamination(self, concentration_particles_l: float) -> str:
        """
        Provisional threshold classification:
        - LOW: < LOW_CONCENTRATION_THRESHOLD
        - MODERATE: between LOW and HIGH thresholds
        - HIGH: > HIGH_CONCENTRATION_THRESHOLD
        """
        if concentration_particles_l < settings.LOW_CONCENTRATION_THRESHOLD:
            return "LOW"
        elif concentration_particles_l <= settings.HIGH_CONCENTRATION_THRESHOLD:
            return "MODERATE"
        else:
            return "HIGH"

    def process_and_save_analysis(
        self,
        db: Session,
        sample: Sample,
        image_bytes: bytes,
        original_filename: str,
        optical_magnification: Optional[str] = "10x",
        confidence_threshold: Optional[float] = None
    ) -> AnalysisResult:
        """
        Full end-to-end detection execution:
        1. Decode image bytes
        2. Execute AI detection & measurement
        3. Calculate concentration & contamination risk
        4. Render and save annotated microscope image
        5. Persist sample analysis and detected particles
        """
        if confidence_threshold is not None:
            self.detector.confidence_threshold = confidence_threshold

        if optical_magnification:
            self.detector.set_optical_magnification(optical_magnification)

        # Decode image
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError("Invalid image file: Failed to decode image bytes")

        height, width = img_bgr.shape[:2]
        unique_prefix = uuid.uuid4().hex[:10]
        safe_base_name = f"{unique_prefix}_{Path(original_filename).stem}.png"
        annotated_base_name = f"annotated_{safe_base_name}"

        raw_rel_path = f"/static/uploads/{safe_base_name}"
        annotated_rel_path = f"/static/uploads/{annotated_base_name}"

        raw_disk_path = os.path.join(settings.UPLOAD_DIR, safe_base_name)
        annotated_disk_path = os.path.join(settings.UPLOAD_DIR, annotated_base_name)

        # Save raw image
        cv2.imwrite(raw_disk_path, img_bgr)

        # Run AI detection
        detection_output = self.detector.detect(img_bgr)
        particles = detection_output["particles"]
        total_particle_count = len(particles)

        # Calculate concentration and contamination classification
        concentration = self.calculate_concentration(total_particle_count, sample.volume_ml)
        contamination_level = self.classify_contamination(concentration)

        # Render annotated bounding boxes
        annotated_bgr = self.detector.render_annotated_image(img_bgr, particles)
        cv2.imwrite(annotated_disk_path, annotated_bgr)

        # Persist AnalysisResult
        analysis_record = AnalysisResult(
            sample_id=sample.id,
            image_path=raw_rel_path,
            annotated_image_path=annotated_rel_path,
            total_particle_count=total_particle_count,
            concentration_particles_per_liter=concentration,
            contamination_level=contamination_level,
            status="COMPLETED"
        )
        db.add(analysis_record)
        db.flush()

        # Persist ImageMetadata
        img_meta = ImageMetadata(
            analysis_id=analysis_record.id,
            file_name=original_filename,
            file_size=len(image_bytes),
            width=width,
            height=height,
            mime_type="image/png" if original_filename.lower().endswith(".png") else "image/jpeg"
        )
        db.add(img_meta)

        # Persist granular DetectedParticle records
        for p in particles:
            particle_db = DetectedParticle(
                analysis_id=analysis_record.id,
                particle_type=p["particle_type"],
                size_um=p.get("size_um", 0.0),
                confidence=p["confidence"],
                x_min=p["x_min"],
                y_min=p["y_min"],
                x_max=p["x_max"],
                y_max=p["y_max"]
            )
            db.add(particle_db)

        db.commit()
        db.refresh(analysis_record)
        return analysis_record

detection_service = DetectionService()
