import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_incident_creation_priority_matrix(async_client: AsyncClient, agent_headers: dict):
    # Test P1 Critical (Impact 3 + Urgency 3)
    res_p1 = await async_client.post(
        "/api/v1/incidents",
        json={
            "title": "Data Center Power Outage",
            "description": "Total rack outage in DC-East",
            "category": "Infrastructure",
            "impact": 3,
            "urgency": 3
        },
        headers=agent_headers
    )
    assert res_p1.status_code == 201, res_p1.text
    data_p1 = res_p1.json()
    assert data_p1["incident_number"].startswith("INC-")
    assert data_p1["priority"] == "P1_Critical"

    # Test P2 High (Impact 3 + Urgency 2)
    res_p2 = await async_client.post(
        "/api/v1/incidents",
        json={
            "title": "ERP Database Slow Response",
            "description": "DB latency is 5000ms",
            "category": "Database",
            "impact": 3,
            "urgency": 2
        },
        headers=agent_headers
    )
    assert res_p2.status_code == 201, res_p2.text
    assert res_p2.json()["priority"] == "P2_High"

    # Test P4 Low (Impact 1 + Urgency 1)
    res_p4 = await async_client.post(
        "/api/v1/incidents",
        json={
            "title": "Monitor Stand Adjustment Request",
            "description": "Need desktop ergonomic mount",
            "category": "Hardware",
            "impact": 1,
            "urgency": 1
        },
        headers=agent_headers
    )
    assert res_p4.status_code == 201, res_p4.text
    assert res_p4.json()["priority"] == "P4_Low"

@pytest.mark.asyncio
async def test_incident_lifecycle_and_comments(async_client: AsyncClient, agent_headers: dict):
    # Create incident
    create_res = await async_client.post(
        "/api/v1/incidents",
        json={
            "title": "VPN Connectivity Failure",
            "description": "Remote users unable to connect to US-West gateway",
            "category": "Network",
            "impact": 2,
            "urgency": 2
        },
        headers=agent_headers
    )
    assert create_res.status_code == 201, create_res.text
    inc_id = create_res.json()["id"]

    # Status update to In Progress
    status_res = await async_client.patch(
        f"/api/v1/incidents/{inc_id}/status",
        json={"status": "In Progress", "resolution_notes": "Engineer investigating radius server logs"},
        headers=agent_headers
    )
    assert status_res.status_code == 200, status_res.text
    assert status_res.json()["status"] == "In Progress"

    # Add comment
    comment_res = await async_client.post(
        f"/api/v1/incidents/{inc_id}/comments",
        json={"content": "Restarted radius service container", "is_internal": False},
        headers=agent_headers
    )
    assert comment_res.status_code == 200, comment_res.text
    assert comment_res.json()["content"] == "Restarted radius service container"

    # Status update to Resolved
    resolve_res = await async_client.patch(
        f"/api/v1/incidents/{inc_id}/status",
        json={"status": "Resolved", "resolution_notes": "Radius container healthy"},
        headers=agent_headers
    )
    assert resolve_res.status_code == 200, resolve_res.text
    assert resolve_res.json()["status"] == "Resolved"

@pytest.mark.asyncio
async def test_ai_incident_analysis(async_client: AsyncClient, agent_headers: dict):
    analysis_res = await async_client.post(
        "/api/v1/ai/analyze-incident",
        json={
            "title": "Database connection pool exhausted",
            "description": "PostgreSQL backend reporting max client connections reached on port 5432",
            "category": "Database"
        },
        headers=agent_headers
    )
    assert analysis_res.status_code == 200, analysis_res.text
    ai_data = analysis_res.json()
    assert "summary" in ai_data
    assert "probable_root_cause" in ai_data
    assert "recommended_steps" in ai_data
    assert "confidence" in ai_data
    assert "suggested_priority" in ai_data
