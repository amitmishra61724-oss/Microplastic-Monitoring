import os
import pytest
from fastapi.testclient import TestClient

# Set sqlite memory db for testing before importing app settings
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from app.main import app

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
