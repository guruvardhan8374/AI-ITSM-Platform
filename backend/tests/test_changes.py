import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_change_request_lifecycle_and_rollback(
    async_client: AsyncClient,
    engineer_headers: dict,
    manager_headers: dict
):
    # Create Normal Change Request
    create_res = await async_client.post(
        "/api/v1/changes",
        json={
            "title": "Upgrade Core Router Firmware",
            "description": "Apply security patch v4.2 to enterprise edge routers",
            "reason": "Vulnerability CVE-2026-8819 patch",
            "change_type": "NORMAL",
            "impact": 3,
            "urgency": 2,
            "implementation_plan": "1. Backup config 2. Flash image 3. Verify routes",
            "rollback_plan": "Restore configuration backup and downgrade firmware",
            "validation_plan": "Run ping mesh and verify BGP peering state"
        },
        headers=engineer_headers
    )
    assert create_res.status_code == 200
    chg_data = create_res.json()
    assert chg_data["change_number"].startswith("CHG-")
    chg_id = chg_data["id"]
    assert chg_data["approval_status"] == "PENDING"

    # Approve Change Request (by manager)
    approve_res = await async_client.post(
        f"/api/v1/changes/{chg_id}/approve",
        json={"comments": "Approved for maintenance window"},
        headers=manager_headers
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["approval_status"] == "APPROVED"

    # Test Rollback
    rollback_res = await async_client.post(
        f"/api/v1/changes/{chg_id}/rollback",
        json={"comments": "BGP flapping detected post-flash"},
        headers=engineer_headers
    )
    assert rollback_res.status_code == 200
    assert rollback_res.json()["status"] == "ROLLED_BACK"
