import pytest
from pydantic import ValidationError
from app.schemas.domain import (
    SampleCreate,
    DetectedParticleCreate,
    AnalysisResultCreate,
    ImageMetadataCreate
)

def test_sample_schema_valid():
    sample = SampleCreate(
        sample_code="SMP-2026-001",
        location="Lake Geneva",
        volume_ml=500.0,
        notes="Microscope sample slice A"
    )
    assert sample.volume_ml == 500.0
    assert sample.sample_code == "SMP-2026-001"

def test_sample_schema_invalid_volume_zero():
    with pytest.raises(ValidationError) as exc:
        SampleCreate(
            sample_code="SMP-ERR",
            volume_ml=0.0
        )
    assert "volume_ml" in str(exc.value)

def test_sample_schema_invalid_volume_negative():
    with pytest.raises(ValidationError) as exc:
        SampleCreate(
            sample_code="SMP-ERR",
            volume_ml=-50.0
        )
    assert "volume_ml" in str(exc.value)

def test_particle_schema_valid():
    particle = DetectedParticleCreate(
        particle_type="fragment",
        size_um=45.2,
        confidence=0.95,
        x_min=10.0,
        y_min=20.0,
        x_max=50.0,
        y_max=60.0
    )
    assert particle.confidence == 0.95

def test_particle_schema_invalid_confidence_above_one():
    with pytest.raises(ValidationError) as exc:
        DetectedParticleCreate(
            confidence=1.5,
            x_min=0, y_min=0, x_max=10, y_max=10
        )
    assert "confidence" in str(exc.value)

def test_particle_schema_invalid_confidence_below_zero():
    with pytest.raises(ValidationError) as exc:
        DetectedParticleCreate(
            confidence=-0.1,
            x_min=0, y_min=0, x_max=10, y_max=10
        )
    assert "confidence" in str(exc.value)

def test_particle_schema_negative_size_um():
    with pytest.raises(ValidationError) as exc:
        DetectedParticleCreate(
            confidence=0.9,
            size_um=-5.0,
            x_min=0, y_min=0, x_max=10, y_max=10
        )
    assert "size_um" in str(exc.value)

def test_analysis_result_schema_valid():
    # Concentration particles per liter calculation: total / (volume_ml / 1000)
    # E.g., 25 particles in 500 mL => 25 / (500 / 1000) = 50 particles / L
    result = AnalysisResultCreate(
        sample_id=1,
        image_path="/uploads/sample_001.png",
        total_particle_count=25,
        concentration_particles_per_liter=50.0,
        contamination_level="HIGH"
    )
    assert result.total_particle_count == 25
    assert result.concentration_particles_per_liter == 50.0

def test_analysis_result_schema_negative_particle_count():
    with pytest.raises(ValidationError) as exc:
        AnalysisResultCreate(
            sample_id=1,
            image_path="/uploads/sample_001.png",
            total_particle_count=-10,
            concentration_particles_per_liter=0.0
        )
    assert "total_particle_count" in str(exc.value)

def test_image_metadata_schema_invalid_dimensions():
    with pytest.raises(ValidationError) as exc:
        ImageMetadataCreate(
            file_name="sample.png",
            file_size=1024,
            width=-100,
            height=0
        )
    assert "width" in str(exc.value)
