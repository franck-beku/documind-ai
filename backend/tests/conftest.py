import pytest
import os
import sys

# Force Python à utiliser backend/ comme racine
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ["DB_PATH"] = "test_documind.db"

from main import app
from database import init_db
from fastapi.testclient import TestClient


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    init_db()
    yield
    if os.path.exists("test_documind.db"):
        os.remove("test_documind.db")


@pytest.fixture(scope="session")
def client():
    return TestClient(app)


@pytest.fixture(scope="session")
def auth_headers(client):
    client.post("/api/auth/register", json={
        "email":     "admin@test.com",
        "password":  "password123",
        "full_name": "Admin Test"
    })
    res = client.post("/api/auth/login", data={
        "username": "admin@test.com",
        "password": "password123"
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def user_headers(client):
    client.post("/api/auth/register", json={
        "email":     "user@test.com",
        "password":  "password123",
        "full_name": "User Test"
    })
    res = client.post("/api/auth/login", data={
        "username": "user@test.com",
        "password": "password123"
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}