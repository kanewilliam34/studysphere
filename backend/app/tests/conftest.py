from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.v1.deps import get_db
from app.core.database import Base
from app.main import app

# In-memory SQLite database with StaticPool
test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(autouse=True)
def clean_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db() -> Generator[Session, None, None]:
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def alice_auth(client: TestClient) -> dict:
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Alice Developer",
            "email": "alice@example.com",
            "password": "Password123!",
        },
    )
    assert resp.status_code == 201, f"Alice registration failed: {resp.text}"
    data = resp.json()
    token = data["access_token"]
    return {
        "headers": {"Authorization": f"Bearer {token}"},
        "user": data["user"],
        "token": token,
    }


@pytest.fixture
def bob_auth(client: TestClient) -> dict:
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Bob Student",
            "email": "bob@example.com",
            "password": "Password456!",
        },
    )
    assert resp.status_code == 201, f"Bob registration failed: {resp.text}"
    data = resp.json()
    token = data["access_token"]
    return {
        "headers": {"Authorization": f"Bearer {token}"},
        "user": data["user"],
        "token": token,
    }
