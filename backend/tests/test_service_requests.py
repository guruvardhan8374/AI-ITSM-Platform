import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_service_catalog_and_request_workflow(
    async_client: AsyncClient,
    user_headers: dict,
    manager_headers: dict
):
    # Fetch catalog items
    catalog_res = await async_client.get("/api/v1/service-requests/catalog", headers=user_headers)
    assert catalog_res.status_code == 200, catalog_res.text
    catalog = catalog_res.json()
    assert len(catalog) > 0
    service_id = catalog[0]["id"]

    # Submit service request
    req_res = await async_client.post(
        "/api/v1/service-requests",
        json={
            "service_id": service_id,
            "title": "Request for High-Performance Developer Laptop",
            "description": "Required for compiling rust and python services locally",
            "additional_info": "32GB RAM requested"
        },
        headers=user_headers
    )
    assert req_res.status_code == 201, req_res.text
    req_data = req_res.json()
    assert req_data["request_number"].startswith("REQ-")
    req_id = req_data["id"]

    # Approve request (by manager)
    approve_res = await async_client.post(
        f"/api/v1/service-requests/{req_id}/approve",
        json={"comments": "Approved for dev team allocation"},
        headers=manager_headers
    )
    assert approve_res.status_code == 200, approve_res.text
    assert approve_res.json()["approval_status"] == "APPROVED"

    # Fulfill request via status update endpoint
    fulfill_res = await async_client.patch(
        f"/api/v1/service-requests/{req_id}/status",
        json={"status": "FULFILLMENT"},
        headers=manager_headers
    )
    assert fulfill_res.status_code == 200, fulfill_res.text
    assert fulfill_res.json()["status"] == "FULFILLMENT"
