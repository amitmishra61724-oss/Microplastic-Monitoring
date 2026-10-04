"""
Integration Tests for Microplastic Monitoring API Endpoints
"""

import io
import pytest
import numpy as np
import cv2

def test_samples_crud_cycle(client):
    # 1. Create a sample
    sample_payload = {
        "sample_code": "SMP-TEST-001",
        "location": "Biscayne Bay Intake",
        "volume_ml": 750.0,
        "notes": "Marine water intake sample for automated screening"
    }
    create_res = client.post("/api/v1/samples", json=sample_payload)
    assert create_res.status_code == 201
    sample_data = create_res.json()
    sample_id = sample_data["id"]
    assert sample_data["sample_code"] == "SMP-TEST-001"
    assert sample_data["volume_ml"] == 750.0

    # 2. Duplicate code should fail (400)
    dup_res = client.post("/api/v1/samples", json=sample_payload)
    assert dup_res.status_code == 400

    # 3. Retrieve sample by ID
    get_res = client.get(f"/api/v1/samples/{sample_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == sample_id

    # 4. List samples
    list_res = client.get("/api/v1/samples?search=Biscayne")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 5. Delete sample
    del_res = client.delete(f"/api/v1/samples/{sample_id}")
    assert del_res.status_code == 204

    # 6. Verify deleted
    get_del = client.get(f"/api/v1/samples/{sample_id}")
    assert get_del.status_code == 404


def test_demo_sample_library(client):
    res = client.get("/api/v1/demo/samples")
    assert res.status_code == 200
    demos = res.json()
    assert isinstance(demos, list)
    if len(demos) > 0:
        first = demos[0]
        assert "name" in first
        assert "recommended_volume_ml" in first


def test_analyze_demo_sample(client):
    # Get available demos
    demos_res = client.get("/api/v1/demo/samples")
    demos = demos_res.json()
    if not demos:
        pytest.skip("No demo samples preloaded")

    demo_name = demos[0]["name"]
    res = client.post(f"/api/v1/analysis/analyze-demo?demo_name={demo_name}&volume_ml=500.0")
    assert res.status_code == 201
    data = res.json()
    assert "id" in data
    assert "total_particle_count" in data
    assert "concentration_particles_per_liter" in data
    assert data["contamination_level"] in ["LOW", "MODERATE", "HIGH"]
    assert "annotated_image_path" in data


def test_upload_image_analysis(client):
    # Create synthetic test microscope image in memory
    img = np.ones((512, 512, 3), dtype=np.uint8) * 230
    # Draw a simulated particle
    cv2.circle(img, (256, 256), 25, (40, 40, 180), -1)
    is_success, buffer = cv2.imencode(".png", img)
    assert is_success

    file_bytes = io.BytesIO(buffer)

    upload_res = client.post(
        "/api/v1/analysis/upload",
        data={
            "sample_code": "SMP-UPLOAD-001",
            "volume_ml": 500.0,
            "location": "Coastal Test Station",
            "notes": "Direct upload integration test"
        },
        files={"file": ("test_microscope.png", file_bytes, "image/png")}
    )
    assert upload_res.status_code == 201
    data = upload_res.json()
    assert data["total_particle_count"] >= 1
    analysis_id = data["id"]

    # Concentration check: 1 particle in 500 mL => 2.0 particles/L
    assert data["concentration_particles_per_liter"] > 0

    # Get analysis detail
    detail_res = client.get(f"/api/v1/analysis/{analysis_id}")
    assert detail_res.status_code == 200

    # Download lab report
    report_res = client.get(f"/api/v1/analysis/{analysis_id}/report?format=json")
    assert report_res.status_code == 200
    report_data = report_res.json()
    assert "report_id" in report_data

    # Download CSV report
    csv_res = client.get(f"/api/v1/analysis/{analysis_id}/report?format=csv")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]


def test_analytics_summary_kpi(client):
    res = client.get("/api/v1/analytics/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_samples" in data
    assert "total_analyses" in data
    assert "total_particles_detected" in data
    assert "mean_concentration_particles_l" in data
    assert "risk_distribution" in data
    assert "particle_type_distribution" in data
