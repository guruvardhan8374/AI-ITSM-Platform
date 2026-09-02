from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List, Optional

from app.database.session import get_db
from app.models.domain_models import (
    SLAPolicy, Notification, AuditLog, Incident, ServiceRequest, Problem, ChangeRequest, Asset, InfrastructureResource, KnowledgeArticle, User
)
from app.schemas.governance import (
    SLAPolicySchema, SLAPolicyUpdate, NotificationSchema, GlobalSearchResponse, GlobalSearchResultItem, SystemHealthResponse
)
from app.api.deps import get_current_user

router = APIRouter()

# ==================== SLA GOVERNANCE ====================

@router.get("/sla/policies", response_model=List[SLAPolicySchema], summary="List SLA Policies")
async def list_sla_policies(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    res = await db.execute(select(SLAPolicy))
    return res.scalars().all()

@router.put("/sla/policies/{id}", response_model=SLAPolicySchema, summary="Update SLA Targets & Policy")
async def update_sla_policy(
    id: str,
    input_data: SLAPolicyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role.name not in ["SUPER_ADMIN", "IT_MANAGER"]:
        raise HTTPException(status_code=403, detail="Only IT Managers and Super Admins can configure SLA targets.")

    res = await db.execute(select(SLAPolicy).where(SLAPolicy.id == id))
    policy = res.scalar_one_or_none()
    if not policy:
        raise HTTPException(status_code=404, detail="SLA Policy not found")

    if input_data.name: policy.name = input_data.name
    if input_data.response_time_minutes is not None: policy.response_time_minutes = input_data.response_time_minutes
    if input_data.resolution_time_minutes is not None: policy.resolution_time_minutes = input_data.resolution_time_minutes
    if input_data.warning_threshold_percent is not None: policy.warning_threshold_percent = input_data.warning_threshold_percent
    if input_data.is_active is not None: policy.is_active = input_data.is_active

    audit = AuditLog(
        user_id=current_user.id,
        action="SLA_POLICY_UPDATED",
        module="Governance",
        entity_id=policy.id,
        details=f"Updated SLA targets for {policy.priority}: response={policy.response_time_minutes}m, resolution={policy.resolution_time_minutes}m"
    )
    db.add(audit)
    await db.commit()
    await db.refresh(policy)
    return policy

# ==================== NOTIFICATIONS CENTER ====================

@router.get("/notifications", response_model=List[NotificationSchema], summary="List User Notifications")
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    is_read: Optional[bool] = Query(None)
):
    stmt = select(Notification).where(Notification.user_id == current_user.id).order_by(Notification.created_at.desc())
    if is_read is not None:
        stmt = stmt.where(Notification.is_read == is_read)

    res = await db.execute(stmt)
    return res.scalars().all()

@router.patch("/notifications/{id}/read", response_model=NotificationSchema, summary="Mark Notification Read")
async def mark_notification_read(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    res = await db.execute(select(Notification).where(Notification.id == id, Notification.user_id == current_user.id))
    notif = res.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    await db.commit()
    await db.refresh(notif)
    return notif

@router.post("/notifications/read-all", summary="Mark All Notifications Read")
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    res = await db.execute(select(Notification).where(Notification.user_id == current_user.id, Notification.is_read == False))
    notifs = res.scalars().all()
    for n in notifs:
        n.is_read = True
    await db.commit()
    return {"message": "All notifications marked as read", "count": len(notifs)}

# ==================== GLOBAL SEARCH ENGINE ====================

@router.get("/search", response_model=GlobalSearchResponse, summary="Cross-Module Categorized Global Search")
async def global_search(
    query: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    results: List[GlobalSearchResultItem] = []
    q_str = f"%{query}%"

    # Incidents
    inc_res = await db.execute(select(Incident).where(Incident.incident_number.ilike(q_str) | Incident.title.ilike(q_str)).limit(3))
    for inc in inc_res.scalars().all():
        results.append(GlobalSearchResultItem(id=inc.id, title=f"{inc.incident_number} — {inc.title}", type="Incident", subtitle=f"Priority: {inc.priority} | Status: {inc.status}", link=f"/incidents/{inc.id}"))

    # Service Requests
    sr_res = await db.execute(select(ServiceRequest).where(ServiceRequest.request_number.ilike(q_str) | ServiceRequest.title.ilike(q_str)).limit(3))
    for sr in sr_res.scalars().all():
        results.append(GlobalSearchResultItem(id=sr.id, title=f"{sr.request_number} — {sr.title}", type="ServiceRequest", subtitle=f"Status: {sr.status}", link=f"/service-requests/{sr.id}"))

    # Problems
    prb_res = await db.execute(select(Problem).where(Problem.problem_number.ilike(q_str) | Problem.title.ilike(q_str)).limit(3))
    for prb in prb_res.scalars().all():
        results.append(GlobalSearchResultItem(id=prb.id, title=f"{prb.problem_number} — {prb.title}", type="Problem", subtitle=f"Known Error: {prb.known_error}", link=f"/problems/{prb.id}"))

    # Changes
    chg_res = await db.execute(select(ChangeRequest).where(ChangeRequest.change_number.ilike(q_str) | ChangeRequest.title.ilike(q_str)).limit(3))
    for chg in chg_res.scalars().all():
        results.append(GlobalSearchResultItem(id=chg.id, title=f"{chg.change_number} — {chg.title}", type="Change", subtitle=f"Type: {chg.change_type} | Risk: {chg.risk_level}", link=f"/changes/{chg.id}"))

    # Assets
    ast_res = await db.execute(select(Asset).where(Asset.asset_number.ilike(q_str) | Asset.asset_name.ilike(q_str) | Asset.hostname.ilike(q_str)).limit(3))
    for ast in ast_res.scalars().all():
        results.append(GlobalSearchResultItem(id=ast.id, title=f"{ast.asset_number} — {ast.asset_name}", type="Asset", subtitle=f"Type: {ast.asset_type} | Health: {ast.health}", link=f"/assets/{ast.id}"))

    # Infrastructure
    inf_res = await db.execute(select(InfrastructureResource).where(InfrastructureResource.resource_number.ilike(q_str) | InfrastructureResource.name.ilike(q_str) | InfrastructureResource.ip_address.ilike(q_str)).limit(3))
    for inf in inf_res.scalars().all():
        results.append(GlobalSearchResultItem(id=inf.id, title=f"{inf.resource_number} — {inf.name}", type="Infra", subtitle=f"IP: {inf.ip_address} | Health: {inf.health}", link="/infra"))

    # Knowledge Articles
    kb_res = await db.execute(select(KnowledgeArticle).where(KnowledgeArticle.article_number.ilike(q_str) | KnowledgeArticle.title.ilike(q_str)).limit(3))
    for kb in kb_res.scalars().all():
        results.append(GlobalSearchResultItem(id=kb.id, title=f"{kb.article_number} — {kb.title}", type="Knowledge", subtitle=f"Category: {kb.category}", link=f"/knowledge-base/{kb.id}"))

    # Users
    usr_res = await db.execute(select(User).where(User.full_name.ilike(q_str) | User.email.ilike(q_str)).limit(3))
    for usr in usr_res.scalars().all():
        results.append(GlobalSearchResultItem(id=usr.id, title=usr.full_name, type="User", subtitle=usr.email, link="/users"))

    return GlobalSearchResponse(query=query, total_results=len(results), results=results)

# ==================== SYSTEM HEALTH & SETTINGS ====================

@router.get("/settings", summary="Get Platform Settings & AI Provider Config")
async def get_settings(current_user = Depends(get_current_user)):
    return {
        "general": {
            "platform_name": "AI-Powered IT Operations Console",
            "environment": "Production",
            "timezone": "UTC"
        },
        "ai_config": {
            "active_provider": "Mock",
            "status": "Connected",
            "available_providers": ["Mock", "OpenAI", "Gemini", "Anthropic"],
            "model_version": "v1.0.0-enterprise",
            "confidence_threshold": 0.80
        },
        "security": {
            "jwt_expiration_minutes": 1440,
            "mfa_enabled": False,
            "password_min_length": 8
        }
    }
