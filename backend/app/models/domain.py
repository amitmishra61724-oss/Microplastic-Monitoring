from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Sample(Base):
    __tablename__ = "samples"

    id = Column(Integer, primary_key=True, index=True)
    sample_code = Column(String(100), unique=True, index=True, nullable=False)
    collection_date = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    location = Column(String(255), nullable=True)
    volume_ml = Column(Float, nullable=False)  # Must be > 0
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    # Relationships
    analysis_results = relationship("AnalysisResult", back_populates="sample", cascade="all, delete-orphan")


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    sample_id = Column(Integer, ForeignKey("samples.id", ondelete="CASCADE"), nullable=False, index=True)
    image_path = Column(String(500), nullable=False)
    total_particle_count = Column(Integer, nullable=False, default=0)
    concentration_particles_per_liter = Column(Float, nullable=False, default=0.0)
    contamination_level = Column(String(50), nullable=True)  # Nullable provisional classification: LOW, MEDIUM, HIGH
    status = Column(String(50), nullable=False, default="COMPLETED")
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    # Relationships
    sample = relationship("Sample", back_populates="analysis_results")
    particles = relationship("DetectedParticle", back_populates="analysis_result", cascade="all, delete-orphan")
    image_metadata = relationship("ImageMetadata", back_populates="analysis_result", uselist=False, cascade="all, delete-orphan")


class DetectedParticle(Base):
    __tablename__ = "detected_particles"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analysis_results.id", ondelete="CASCADE"), nullable=False, index=True)
    particle_type = Column(String(100), nullable=True)  # e.g., fibre, fragment, pellet, film
    size_um = Column(Float, nullable=True)              # Size in micrometers
    confidence = Column(Float, nullable=False)           # Confidence score [0.0, 1.0]
    x_min = Column(Float, nullable=False)
    y_min = Column(Float, nullable=False)
    x_max = Column(Float, nullable=False)
    y_max = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    # Relationships
    analysis_result = relationship("AnalysisResult", back_populates="particles")


class ImageMetadata(Base):
    __tablename__ = "image_metadata"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analysis_results.id", ondelete="CASCADE"), unique=True, nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)  # in bytes
    width = Column(Integer, nullable=True)       # image pixel width
    height = Column(Integer, nullable=True)      # image pixel height
    mime_type = Column(String(100), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    # Relationships
    analysis_result = relationship("AnalysisResult", back_populates="image_metadata")
