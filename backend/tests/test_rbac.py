import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_audit_log_rbac(
    async_client: AsyncClient,
    admin_headers: dict,
    manager_headers: dict,
    agent_headers: dict,
    user_headers: dict
):
    # Super Admin and IT Manager allowed
    res_admin = await async_client.get("/api/v1/audit-logs", headers=admin_headers)
    assert res_admin.status_code == 200

    res_manager = await async_client.get("/api/v1/audit-logs", headers=manager_headers)
    assert res_manager.status_code == 200

    # Agent and End User forbidden
    res_agent = await async_client.get("/api/v1/audit-logs", headers=agent_headers)
    assert res_agent.status_code == 403

    res_user = await async_client.get("/api/v1/audit-logs", headers=user_headers)
    assert res_user.status_code == 403

@pytest.mark.asyncio
async def test_sla_update_rbac(
    async_client: AsyncClient,
    admin_headers: dict,
    user_headers: dict
):
    # Fetch existing policies
    policies_res = await async_client.get("/api/v1/governance/sla/policies", headers=admin_headers)
    assert policies_res.status_code == 200
    policies = policies_res.json()
    assert len(policies) > 0
    policy_id = policies[0]["id"]

    # End user rejected
    update_res_user = await async_client.put(
        f"/api/v1/governance/sla/policies/{policy_id}",
        json={"response_time_minutes": 20},
        headers=user_headers
    )
    assert update_res_user.status_code == 403

    # Admin allowed
    update_res_admin = await async_client.put(
        f"/api/v1/governance/sla/policies/{policy_id}",
        json={"response_time_minutes": 15},
        headers=admin_headers
    )
    assert update_res_admin.status_code == 200
