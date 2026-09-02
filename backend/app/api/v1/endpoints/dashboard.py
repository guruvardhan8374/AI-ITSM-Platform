from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from sqlalchemy.orm import selectinload

from app.database.session import get_db
from app.models.domain_models import (
    Incident, ServiceRequest, Problem, KnowledgeArticle, ChangeRequest, Asset, InfrastructureResource, InfrastructureAlert
)
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", summary="Get Main IT Operations Dashboard Metrics")
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Incidents Metrics
    inc_total = (await db.execute(select(func.count(Incident.id)))).scalar() or 0
    inc_open = (await db.execute(select(func.count(Incident.id)).where(Incident.status.in_(["New", "Assigned", "In Progress", "Pending"])))).scalar() or 0
    inc_p1 = (await db.execute(select(func.count(Incident.id)).where(Incident.priority == "P1_Critical"))).scalar() or 0

    # Service Requests Metrics
    sr_open = (await db.execute(select(func.count(ServiceRequest.id)).where(ServiceRequest.status.in_(["REQUESTED", "APPROVAL_REQUIRED", "APPROVED", "FULFILLMENT"])))).scalar() or 0
    sr_pending_appr = (await db.execute(select(func.count(ServiceRequest.id)).where(ServiceRequest.approval_status == "PENDING"))).scalar() or 0

    # Problems Metrics
    prb_open = (await db.execute(select(func.count(Problem.id)).where(Problem.status.in_(["OPEN", "INVESTIGATION", "ROOT_CAUSE_IDENTIFIED", "KNOWN_ERROR", "FIX_IN_PROGRESS"])))).scalar() or 0
    known_errors = (await db.execute(select(func.count(Problem.id)).where(Problem.known_error == True))).scalar() or 0

    # Knowledge Base Metrics
    kb_count = (await db.execute(select(func.count(KnowledgeArticle.id)).where(KnowledgeArticle.status == "Published"))).scalar() or 0

    # Change Management Metrics
    chg_total = (await db.execute(select(func.count(ChangeRequest.id)))).scalar() or 0
    chg_pending_appr = (await db.execute(select(func.count(ChangeRequest.id)).where(ChangeRequest.approval_status == "PENDING"))).scalar() or 0
    chg_scheduled = (await db.execute(select(func.count(ChangeRequest.id)).where(ChangeRequest.status == "SCHEDULED"))).scalar() or 0
    chg_completed = (await db.execute(select(func.count(ChangeRequest.id)).where(ChangeRequest.status == "COMPLETED"))).scalar() or 0
    chg_failed = (await db.execute(select(func.count(ChangeRequest.id)).where(ChangeRequest.status.in_(["FAILED", "ROLLED_BACK"])))).scalar() or 0
    success_rate = round((chg_completed / max(1, (chg_completed + chg_failed))) * 100, 1)

    # Asset Metrics
    ast_total = (await db.execute(select(func.count(Asset.id)))).scalar() or 0
    ast_active = (await db.execute(select(func.count(Asset.id)).where(Asset.status == "ACTIVE"))).scalar() or 0
    ast_critical = (await db.execute(select(func.count(Asset.id)).where(Asset.criticality == "CRITICAL"))).scalar() or 0
    ast_healthy = (await db.execute(select(func.count(Asset.id)).where(Asset.health == "HEALTHY"))).scalar() or 0
    ast_warning = (await db.execute(select(func.count(Asset.id)).where(Asset.health.in_(["WARNING", "CRITICAL"])))).scalar() or 0

    # Infrastructure Resource Metrics
    infra_total = (await db.execute(select(func.count(InfrastructureResource.id)))).scalar() or 0
    infra_healthy = (await db.execute(select(func.count(InfrastructureResource.id)).where(InfrastructureResource.health == "HEALTHY"))).scalar() or 0
    infra_warning = (await db.execute(select(func.count(InfrastructureResource.id)).where(InfrastructureResource.health == "WARNING"))).scalar() or 0
    infra_critical = (await db.execute(select(func.count(InfrastructureResource.id)).where(InfrastructureResource.health == "CRITICAL"))).scalar() or 0
    infra_offline = (await db.execute(select(func.count(InfrastructureResource.id)).where(InfrastructureResource.health == "OFFLINE"))).scalar() or 0

    # Recent Infrastructure Alerts
    alerts_stmt = (
        select(InfrastructureAlert)
        .options(selectinload(InfrastructureAlert.resource))
        .order_by(InfrastructureAlert.created_at.desc())
        .limit(5)
    )
    alerts_res = await db.execute(alerts_stmt)
    recent_alerts = [
        {
            "id": a.id,
            "alert_number": a.alert_number,
            "resource_name": a.resource.name if a.resource else "Server",
            "metric": a.metric_name,
            "severity": a.severity,
            "status": a.status,
            "message": a.message,
            "created_at": a.created_at.isoformat()
        }
        for a in alerts_res.scalars().all()
    ]

    # Upcoming Changes
    chg_stmt = (
        select(ChangeRequest)
        .where(ChangeRequest.status.in_(["SCHEDULED", "APPROVED", "PENDING_APPROVAL"]))
        .order_by(ChangeRequest.created_at.desc())
        .limit(5)
    )
    chg_res = await db.execute(chg_stmt)
    upcoming_changes = [
        {
            "id": c.id,
            "change_number": c.change_number,
            "title": c.title,
            "change_type": c.change_type,
            "risk_level": c.risk_level,
            "status": c.status.value if hasattr(c.status, 'value') else str(c.status),
            "approval_status": c.approval_status
        }
        for c in chg_res.scalars().all()
    ]

    return {
        "incidents": {
            "total": inc_total,
            "open": inc_open,
            "critical_p1": inc_p1
        },
        "service_requests": {
            "open": sr_open,
            "pending_approvals": sr_pending_appr
        },
        "problems": {
            "open": prb_open,
            "known_errors": known_errors
        },
        "knowledge_base": {
            "total_articles": kb_count
        },
        "change_management": {
            "total_changes": chg_total,
            "pending_approvals": chg_pending_appr,
            "scheduled": chg_scheduled,
            "completed": chg_completed,
            "success_rate": success_rate
        },
        "asset_management": {
            "total_assets": ast_total,
            "active_assets": ast_active,
            "critical_assets": ast_critical,
            "healthy_assets": ast_healthy,
            "warning_assets": ast_warning
        },
        "infrastructure": {
            "total_resources": infra_total,
            "healthy": infra_healthy,
            "warning": infra_warning,
            "critical": infra_critical,
            "offline": infra_offline
        },
        "recent_alerts": recent_alerts,
        "upcoming_changes": upcoming_changes,
        "predictive_maintenance_insight": {
            "resource_name": "DB-01 Primary Database",
            "metric": "Disk Utilization",
            "predicted_breach_days": 5,
            "recommendation": "Disk utilization trend indicates capacity breach in 5 days. Schedule storage volume expansion."
        }
    }
