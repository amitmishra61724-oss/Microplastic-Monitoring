from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator

# --- Sample Schemas ---
class SampleBase(BaseModel):
    sample_code: str = Field(..., min_length=1, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    volume_ml: float = Field(..., gt=0.0, description="Sample volume in mL must be strictly greater than 0")
    notes: Optional[str] = Field(None, max_length=500)

class SampleCreate(SampleBase):
    pass

class SampleResponse(SampleBase):
    id: int
    collection_date: datetime
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Detected Particle Schemas ---
class DetectedParticleBase(BaseModel):
    particle_type: Optional[str] = Field(None, max_length=100)
    size_um: Optional[float] = Field(None, ge=0.0, description="Particle size in um cannot be negative")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score must be between 0.0 and 1.0")
    x_min: float
    y_min: float
    x_max: float
    y_max: float

    @field_validator("x_max")
    def validate_x_max(cls, v, info):
        if "x_min" in info.data and v < info.data["x_min"]:
            raise ValueError("x_max cannot be less than x_min")
        return v

    @field_validator("y_max")
    def validate_y_max(cls, v, info):
        if "y_min" in info.data and v < info.data["y_min"]:
            raise ValueError("y_max cannot be less than y_min")
        return v

class DetectedParticleCreate(DetectedParticleBase):
    pass

class DetectedParticleResponse(DetectedParticleBase):
    id: int
    analysis_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Image Metadata Schemas ---
class ImageMetadataBase(BaseModel):
    file_name: str = Field(..., min_length=1, max_length=255)
    file_size: int = Field(..., ge=0, description="File size in bytes cannot be negative")
    width: Optional[int] = Field(None, gt=0, description="Image width in pixels must be positive")
    height: Optional[int] = Field(None, gt=0, description="Image height in pixels must be positive")
    mime_type: Optional[str] = Field(None, max_length=100)

class ImageMetadataCreate(ImageMetadataBase):
    pass

class ImageMetadataResponse(ImageMetadataBase):
    id: int
    analysis_id: int
    uploaded_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Analysis Result Schemas ---
class AnalysisResultBase(BaseModel):
    image_path: str = Field(..., min_length=1, max_length=500)
    annotated_image_path: Optional[str] = Field(None, max_length=500)
    total_particle_count: int = Field(..., ge=0, description="Total particle count cannot be negative")
    concentration_particles_per_liter: float = Field(..., ge=0.0, description="Concentration cannot be negative")
    contamination_level: Optional[str] = Field(None, max_length=50, description="Nullable provisional classification")
    status: str = Field("COMPLETED", max_length=50)

class AnalysisResultCreate(AnalysisResultBase):
    sample_id: int

class AnalysisResultResponse(AnalysisResultBase):
    id: int
    sample_id: int
    created_at: datetime
    image_metadata: Optional[ImageMetadataResponse] = None
    particles: List[DetectedParticleResponse] = []
    sample: Optional[SampleResponse] = None
    particle_type_summary: Optional[dict] = None
    model_config = ConfigDict(from_attributes=True)


# --- Analytics & Demo Schemas ---
class AnalyticsSummaryResponse(BaseModel):
    total_samples: int
    total_analyses: int
    total_particles_detected: int
    mean_concentration_particles_l: float
    risk_distribution: dict
    particle_type_distribution: dict
    recent_analyses: List[AnalysisResultResponse] = []

class DemoSampleResponse(BaseModel):
    name: str
    display_name: str
    image_url: str
    recommended_volume_ml: float
    ground_truth_particle_count: int
    ground_truth_concentration_particles_l: float
    ground_truth_level: str

