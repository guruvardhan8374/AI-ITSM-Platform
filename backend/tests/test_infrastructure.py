import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_infrastructure_cpu_spike_automation(
    async_client: AsyncClient,
    engineer_headers: dict,
    admin_headers: dict
):
    # Fetch infrastructure resources
    list_res = await async_client.get("/api/v1/infrastructure", headers=engineer_headers)
    assert list_res.status_code == 200, list_res.text
    resources = list_res.json()
    assert len(resources) > 0
    res_id = resources[0]["id"]

    # Trigger CPU spike > 90%
    check_res = await async_client.post(
        f"/api/v1/infrastructure/{res_id}/check?simulate_spike=true",
        headers=engineer_headers
    )
    assert check_res.status_code == 200, check_res.text
    res_data = check_res.json()
    assert res_data["health"] == "CRITICAL"
    assert res_data["cpu_percent"] > 90.0

    # Verify CRITICAL alert generated
    alerts_res = await async_client.get("/api/v1/infrastructure/alerts/all", headers=engineer_headers)
    assert alerts_res.status_code == 200, alerts_res.text
    alerts = alerts_res.json()
    critical_alerts = [a for a in alerts if a["severity"] == "CRITICAL" and a["resource_id"] == res_id]
    assert len(critical_alerts) > 0
    latest_alert = critical_alerts[0]
    assert latest_alert["incident_id"] is not None

    # Verify P1 Incident created
    inc_id = latest_alert["incident_id"]
    inc_res = await async_client.get(f"/api/v1/incidents/{inc_id}", headers=engineer_headers)
    assert inc_res.status_code == 200, inc_res.text
    inc = inc_res.json()
    assert inc["priority"] == "P1_Critical"
    assert "Critical" in inc["title"]

    # Verify Audit log recorded
    audit_res = await async_client.get("/api/v1/audit-logs?module=Infrastructure", headers=admin_headers)
    assert audit_res.status_code == 200, audit_res.text
