from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func

from app.database.session import get_db
from app.models.domain_models import (
    ChangeRequest, ChangeRequestHistory, User, Team, Asset, Incident, Notification, AuditLog, ChangeStatusEnum
)
from app.schemas.change_management import (
    ChangeCreateRequest, ChangeUpdateRequest, ChangeApprovalRequest, ChangeResponse, ChangeHistoryResponse
)
from app.api.deps import get_current_user

router = APIRouter()

def calculate_recommended_risk(change_type: str, impact: int, urgency: int, asset_criticality: str = "MEDIUM") -> str:
    score = impact * urgency
    if change_type == "EMERGENCY" or asset_criticality == "CRITICAL" or score >= 9:
        return "CRITICAL"
    elif score >= 6 or change_type == "NORMAL":
        return "HIGH" if score >= 6 else "MEDIUM"
    elif score >= 4:
        return "MEDIUM"
    return "LOW"

@router.post("", response_model=ChangeResponse, summary="Create Change Request")
async def create_change(
    change_in: ChangeCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Auto generate CHG-XXXX number
    count_res = await db.execute(select(func.count(ChangeRequest.id)))
    count = count_res.scalar() or 0
    change_number = f"CHG-{1001 + count}"

    # Calculate recommended risk level
    risk = calculate_recommended_risk(change_in.change_type, change_in.impact, change_in.urgency)

    # Initial status
    initial_status = ChangeStatusEnum.PENDING_APPROVAL if change_in.change_type != "STANDARD" else ChangeStatusEnum.APPROVED
    approval_status = "PENDING" if change_in.change_type != "STANDARD" else "APPROVED"

    new_change = ChangeRequest(
        change_number=change_number,
        title=change_in.title,
        description=change_in.description,
        reason=change_in.reason,
        change_type=change_in.change_type,
        risk_level=risk,
        impact=change_in.impact,
        urgency=change_in.urgency,
        affected_services=change_in.affected_services,
        requested_by_id=current_user.id,
        assigned_team_id=change_in.assigned_team_id,
        assigned_engineer_id=change_in.assigned_engineer_id,
        implementation_plan=change_in.implementation_plan,
        rollback_plan=change_in.rollback_plan,
        validation_plan=change_in.validation_plan,
        scheduled_start=change_in.scheduled_start,
        scheduled_end=change_in.scheduled_end,
        approval_status=approval_status,
        status=initial_status
    )
    db.add(new_change)
    await db.flush()

    # Link affected assets
    if change_in.affected_asset_ids:
        assets_res = await db.execute(select(Asset).where(Asset.id.in_(change_in.affected_asset_ids)))
        new_change.affected_assets_list.extend(assets_res.scalars().all())

    # Link related incidents
    if change_in.related_incident_ids:
        inc_res = await db.execute(select(Incident).where(Incident.id.in_(change_in.related_incident_ids)))
        new_change.incidents.extend(inc_res.scalars().all())

    # Audit history
    hist = ChangeRequestHistory(
        change_id=new_change.id,
        changed_by_id=current_user.id,
        field_changed="Status",
        old_value=None,
        new_value=initial_status.value
    )
    db.add(hist)

    audit = AuditLog(
        user_id=current_user.id,
        action="CHANGE_CREATED",
        module="Change Management",
        entity_id=new_change.id,
        details=f"Created Change Request {change_number} ({change_in.change_type}) with risk {risk}"
    )
    db.add(audit)

    await db.commit()

    # Fetch loaded record
    res = await db.execute(
        select(ChangeRequest)
        .options(
            selectinload(ChangeRequest.requester),
            selectinload(ChangeRequest.assigned_team),
            selectinload(ChangeRequest.engineer),
            selectinload(ChangeRequest.approver),
            selectinload(ChangeRequest.incidents),
            selectinload(ChangeRequest.affected_assets_list),
            selectinload(ChangeRequest.history).selectinload(ChangeRequestHistory.changed_by)
        )
        .where(ChangeRequest.id == new_change.id)
    )
    return res.scalars().first()

@router.get("", response_model=List[ChangeResponse], summary="List Change Requests")
async def list_changes(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    change_type: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(ChangeRequest)
        .options(
            selectinload(ChangeRequest.requester),
            selectinload(ChangeRequest.assigned_team),
            selectinload(ChangeRequest.engineer),
            selectinload(ChangeRequest.approver),
            selectinload(ChangeRequest.incidents),
            selectinload(ChangeRequest.affected_assets_list),
            selectinload(ChangeRequest.history).selectinload(ChangeRequestHistory.changed_by)
        )
        .order_by(ChangeRequest.created_at.desc())
    )

    if status_filter:
        stmt = stmt.where(ChangeRequest.status == status_filter)
    if change_type:
        stmt = stmt.where(ChangeRequest.change_type == change_type)
    if risk_level:
        stmt = stmt.where(ChangeRequest.risk_level == risk_level)

    if search:
        s = f"%{search}%"
        stmt = stmt.where(
            (ChangeRequest.change_number.ilike(s)) |
            (ChangeRequest.title.ilike(s)) |
            (ChangeRequest.description.ilike(s))
        )

    stmt = stmt.offset((page - 1) * limit).limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/{id}", response_model=ChangeResponse, summary="Get Change Details")
async def get_change(id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(ChangeRequest)
        .options(
            selectinload(ChangeRequest.requester),
            selectinload(ChangeRequest.assigned_team),
            selectinload(ChangeRequest.engineer),
            selectinload(ChangeRequest.approver),
            selectinload(ChangeRequest.incidents),
            selectinload(ChangeRequest.affected_assets_list),
            selectinload(ChangeRequest.history).selectinload(ChangeRequestHistory.changed_by)
        )
        .where((ChangeRequest.id == id) | (ChangeRequest.change_number == id))
    )
    res = await db.execute(stmt)
    change = res.scalars().first()
    if not change:
        raise HTTPException(status_code=404, detail="Change request not found")
    return change

@router.put("/{id}", response_model=ChangeResponse, summary="Update Change Request")
async def update_change(
    id: str,
    change_in: ChangeUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(ChangeRequest).where(ChangeRequest.id == id)
    res = await db.execute(stmt)
    change = res.scalars().first()
    if not change:
        raise HTTPException(status_code=404, detail="Change request not found")

    for field, val in change_in.dict(exclude_unset=True).items():
        if val is not None:
            old_val = str(getattr(change, field, ''))
            setattr(change, field, val)
            db.add(ChangeRequestHistory(
                change_id=change.id,
                changed_by_id=current_user.id,
                field_changed=field,
                old_value=old_val,
                new_value=str(val)
            ))

    await db.commit()

    res = await db.execute(
        select(ChangeRequest)
        .options(
            selectinload(ChangeRequest.requester),
            selectinload(ChangeRequest.assigned_team),
            selectinload(ChangeRequest.engineer),
            selectinload(ChangeRequest.approver),
            selectinload(ChangeRequest.incidents),
            selectinload(ChangeRequest.affected_assets_list),
            selectinload(ChangeRequest.history).selectinload(ChangeRequestHistory.changed_by)
        )
        .where(ChangeRequest.id == id)
    )
    return res.scalars().first()

@router.patch("/{id}/status", response_model=ChangeResponse, summary="Update Change Status")
async def update_change_status(
    id: str,
    new_status: str = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(ChangeRequest).where(ChangeRequest.id == id)
    res = await db.execute(stmt)
    change = res.scalars().first()
    if not change:
        raise HTTPException(status_code=404, detail="Change request not found")

    old_status = change.status.value if hasattr(change.status, 'value') else str(change.status)
    change.status = new_status

    if new_status == "COMPLETED":
        change.completed_at = datetime.utcnow()

    db.add(ChangeRequestHistory(
        change_id=change.id,
        changed_by_id=current_user.id,
        field_changed="Status",
        old_value=old_status,
        new_value=new_status
    ))

    audit = AuditLog(
        user_id=current_user.id,
        action="CHANGE_STATUS_UPDATED",
        module="Change Management",
        entity_id=change.id,
        details=f"Change {change.change_number} status updated to {new_status}"
    )
    db.add(audit)

    await db.commit()

    res = await db.execute(
        select(ChangeRequest)
        .options(
            selectinload(ChangeRequest.requester),
            selectinload(ChangeRequest.assigned_team),
            selectinload(ChangeRequest.engineer),
            selectinload(ChangeRequest.approver),
            selectinload(ChangeRequest.incidents),
            selectinload(ChangeRequest.affected_assets_list),
            selectinload(ChangeRequest.history).selectinload(ChangeRequestHistory.changed_by)
        )
        .where(ChangeRequest.id == id)
    )
    return res.scalars().first()

@router.post("/{id}/approve", response_model=ChangeResponse, summary="Approve Change Request")
async def approve_change(
    id: str,
    req: ChangeApprovalRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(ChangeRequest).where(ChangeRequest.id == id)
    res = await db.execute(stmt)
    change = res.scalars().first()
    if not change:
        raise HTTPException(status_code=404, detail="Change request not found")

    change.approval_status = "APPROVED"
    change.status = ChangeStatusEnum.APPROVED
    change.approver_id = current_user.id
    change.approval_decision_at = datetime.utcnow()
    change.approval_comments = req.comments

    db.add(ChangeRequestHistory(
        change_id=change.id,
        changed_by_id=current_user.id,
        field_changed="Approval Status",
        old_value="PENDING",
        new_value="APPROVED"
    ))

    # Send Notification
    notif = Notification(
        user_id=change.requested_by_id,
        title=f"Change {change.change_number} Approved",
        message=f"Your Change Request '{change.title}' has been approved by {current_user.full_name}."
    )
    db.add(notif)

    audit = AuditLog(
        user_id=current_user.id,
        action="CHANGE_APPROVED",
        module="Change Management",
        entity_id=change.id,
        details=f"Change {change.change_number} approved by {current_user.full_name}"
    )
    db.add(audit)

    await db.commit()

    res = await db.execute(
        select(ChangeRequest)
        .options(
            selectinload(ChangeRequest.requester),
            selectinload(ChangeRequest.assigned_team),
            selectinload(ChangeRequest.engineer),
            selectinload(ChangeRequest.approver),
            selectinload(ChangeRequest.incidents),
            selectinload(ChangeRequest.affected_assets_list),
            selectinload(ChangeRequest.history).selectinload(ChangeRequestHistory.changed_by)
        )
        .where(ChangeRequest.id == id)
    )
    return res.scalars().first()

@router.post("/{id}/reject", response_model=ChangeResponse, summary="Reject Change Request")
async def reject_change(
    id: str,
    req: ChangeApprovalRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(ChangeRequest).where(ChangeRequest.id == id)
    res = await db.execute(stmt)
    change = res.scalars().first()
    if not change:
        raise HTTPException(status_code=404, detail="Change request not found")

    change.approval_status = "REJECTED"
    change.status = ChangeStatusEnum.REJECTED
    change.approver_id = current_user.id
    change.approval_decision_at = datetime.utcnow()
    change.approval_comments = req.comments

    db.add(ChangeRequestHistory(
        change_id=change.id,
        changed_by_id=current_user.id,
        field_changed="Approval Status",
        old_value="PENDING",
        new_value="REJECTED"
    ))

    notif = Notification(
        user_id=change.requested_by_id,
        title=f"Change {change.change_number} Rejected",
        message=f"Your Change Request '{change.title}' was rejected. Reason: {req.comments}"
    )
    db.add(notif)

    audit = AuditLog(
        user_id=current_user.id,
        action="CHANGE_REJECTED",
        module="Change Management",
        entity_id=change.id,
        details=f"Change {change.change_number} rejected by {current_user.full_name}"
    )
    db.add(audit)

    await db.commit()

    res = await db.execute(
        select(ChangeRequest)
        .options(
            selectinload(ChangeRequest.requester),
            selectinload(ChangeRequest.assigned_team),
            selectinload(ChangeRequest.engineer),
            selectinload(ChangeRequest.approver),
            selectinload(ChangeRequest.incidents),
            selectinload(ChangeRequest.affected_assets_list),
            selectinload(ChangeRequest.history).selectinload(ChangeRequestHistory.changed_by)
        )
        .where(ChangeRequest.id == id)
    )
    return res.scalars().first()

@router.post("/{id}/rollback", response_model=ChangeResponse, summary="Rollback Change Request")
async def rollback_change(
    id: str,
    req: ChangeApprovalRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(ChangeRequest).where(ChangeRequest.id == id)
    res = await db.execute(stmt)
    change = res.scalars().first()
    if not change:
        raise HTTPException(status_code=404, detail="Change request not found")

    old_status = str(change.status)
    change.status = ChangeStatusEnum.ROLLED_BACK

    db.add(ChangeRequestHistory(
        change_id=change.id,
        changed_by_id=current_user.id,
        field_changed="Status",
        old_value=old_status,
        new_value="ROLLED_BACK"
    ))

    notif = Notification(
        user_id=change.requested_by_id,
        title=f"Change {change.change_number} Rolled Back",
        message=f"Change {change.change_number} failed validation and has been rolled back."
    )
    db.add(notif)

    audit = AuditLog(
        user_id=current_user.id,
        action="CHANGE_ROLLED_BACK",
        module="Change Management",
        entity_id=change.id,
        details=f"Change {change.change_number} executed emergency rollback procedure"
    )
    db.add(audit)

    await db.commit()

    res = await db.execute(
        select(ChangeRequest)
        .options(
            selectinload(ChangeRequest.requester),
            selectinload(ChangeRequest.assigned_team),
            selectinload(ChangeRequest.engineer),
            selectinload(ChangeRequest.approver),
            selectinload(ChangeRequest.incidents),
            selectinload(ChangeRequest.affected_assets_list),
            selectinload(ChangeRequest.history).selectinload(ChangeRequestHistory.changed_by)
        )
        .where(ChangeRequest.id == id)
    )
    return res.scalars().first()

@router.get("/{id}/history", response_model=List[ChangeHistoryResponse], summary="Get Change Audit History")
async def get_change_history(id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(ChangeRequestHistory)
        .options(selectinload(ChangeRequestHistory.changed_by))
        .where(ChangeRequestHistory.change_id == id)
        .order_by(ChangeRequestHistory.timestamp.desc())
    )
    res = await db.execute(stmt)
    return res.scalars().all()
