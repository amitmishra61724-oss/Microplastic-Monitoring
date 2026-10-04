def test_root_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["ai_model_integrated"] is True

def test_api_v1_health(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["ai_model_integrated"] is True
    assert "provisional_thresholds" in data
    assert data["provisional_thresholds"]["low"] == 10.0
    assert data["provisional_thresholds"]["high"] == 50.0


def test_openapi_docs(client):
    response = client.get("/docs")
    assert response.status_code == 200
