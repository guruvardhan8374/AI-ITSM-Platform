import os
import sys
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

# Set sys.path to include both project root and backend directory
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.environ['USE_SQLITE'] = 'true'

from app.main import app
from database.seed.seed_data import seed

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    """Ensure fresh seed data exists before running tests."""
    await seed()

@pytest_asyncio.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

async def get_token_headers(client: AsyncClient, email: str) -> dict:
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"}
    )
    assert response.status_code == 200, f"Login failed for {email}: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest_asyncio.fixture
async def admin_headers(async_client: AsyncClient):
    return await get_token_headers(async_client, "admin@itsm.com")

@pytest_asyncio.fixture
async def manager_headers(async_client: AsyncClient):
    return await get_token_headers(async_client, "manager@itsm.com")

@pytest_asyncio.fixture
async def agent_headers(async_client: AsyncClient):
    return await get_token_headers(async_client, "agent@itsm.com")

@pytest_asyncio.fixture
async def engineer_headers(async_client: AsyncClient):
    return await get_token_headers(async_client, "engineer@itsm.com")

@pytest_asyncio.fixture
async def user_headers(async_client: AsyncClient):
    return await get_token_headers(async_client, "user@itsm.com")
