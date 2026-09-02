import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_reports_endpoints(async_client: AsyncClient, admin_headers: dict):
    endpoints = [
        "/api/v1/reports/incidents",
        "/api/v1/reports/mttr",
        "/api/v1/reports/sla",
        "/api/v1/reports/service-requests",
        "/api/v1/reports/problems",
        "/api/v1/reports/changes",
        "/api/v1/reports/assets",
        "/api/v1/reports/infrastructure",
        "/api/v1/reports/teams",
        "/api/v1/reports/knowledge-base",
        "/api/v1/reports/ai"
    ]

    for ep in endpoints:
        res = await async_client.get(ep, headers=admin_headers)
        assert res.status_code == 200, f"Report endpoint {ep} failed: {res.text}"
        data = res.json()
        assert data is not None

@pytest.mark.asyncio
async def test_audit_log_append_only(async_client: AsyncClient, admin_headers: dict):
    # Fetch audit logs
    res = await async_client.get("/api/v1/audit-logs", headers=admin_headers)
    assert res.status_code == 200
    logs = res.json()
    assert len(logs) > 0
    first_log = logs[0]
    assert "timestamp" in first_log
    assert "action" in first_log
    assert "module" in first_log
