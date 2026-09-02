import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_demo_accounts_login(async_client: AsyncClient):
    accounts = [
        "admin@itsm.com",
        "manager@itsm.com",
        "agent@itsm.com",
        "engineer@itsm.com",
        "user@itsm.com"
    ]
    for email in accounts:
        response = await async_client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "Password123!"}
        )
        assert response.status_code == 200, f"Login failed for {email}: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        # Verify password is not in response
        assert "password" not in data
        assert "password_hash" not in data

@pytest.mark.asyncio
async def test_invalid_password(async_client: AsyncClient):
    response = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "admin@itsm.com", "password": "WrongPassword!"}
    )
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_nonexistent_user(async_client: AsyncClient):
    response = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@itsm.com", "password": "Password123!"}
    )
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_current_user(async_client: AsyncClient, admin_headers: dict):
    response = await async_client.get("/api/v1/auth/me", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@itsm.com"
    assert "password" not in data
    assert "password_hash" not in data

@pytest.mark.asyncio
async def test_protected_route_rejects_unauthenticated(async_client: AsyncClient):
    response = await async_client.get("/api/v1/auth/me")
    assert response.status_code == 401
