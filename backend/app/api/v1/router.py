from fastapi import APIRouter
from app.api.v1.endpoints import (
    health, auth, dashboard, incidents, ai, service_requests, problems, knowledge_base,
    changes, assets, infrastructure, reports, audit_logs, organization, governance
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health Check"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(incidents.router, prefix="/incidents", tags=["Incident Management"])
api_router.include_router(service_requests.router, prefix="/service-requests", tags=["Service Request Management"])
api_router.include_router(problems.router, prefix="/problems", tags=["Problem Management"])
api_router.include_router(knowledge_base.router, prefix="/knowledge-base", tags=["Knowledge Base"])
api_router.include_router(changes.router, prefix="/changes", tags=["Change Management"])
api_router.include_router(assets.router, prefix="/assets", tags=["Asset Management"])
api_router.include_router(infrastructure.router, prefix="/infrastructure", tags=["Infrastructure Monitoring"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports & Analytics"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["Audit Log Management"])
api_router.include_router(organization.router, prefix="/organization", tags=["User & Organization Management"])
api_router.include_router(governance.router, prefix="/governance", tags=["SLA Governance & Search"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Engine Diagnostics"])
