from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, or_
from sqlalchemy.orm import selectinload

from app.database.session import get_db
from app.api.deps import get_current_user, require_permission
from app.models.domain_models import Incident, IncidentComment, IncidentHistory, User, Team, Asset, Notification, StatusEnum, PriorityEnum
from app.schemas.incident import (
    IncidentCreate, IncidentUpdate, IncidentResponse, 
    IncidentStatusUpdate, IncidentAssignUpdate, IncidentPriorityUpdate,
    IncidentCommentCreate, IncidentCommentResponse, IncidentHistoryResponse
)
from app.services.priority_service import calculate_recommended_priority
from app.services.sla_service import calculate_sla_due_time, get_sla_status

router = APIRouter()

@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED, summary="Create New Incident")
async def create_incident(
    incident_in: IncidentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Auto-generate Incident Number (INC-1001, INC-1002, etc.)
    count_stmt = select(func.count(Incident.id))
    res = await db.execute(count_stmt)
    total_count = res.scalar() or 0
    next_num = 1001 + total_count
    inc_number = f"INC-{next_num}"

    # Calculate Priority
    if incident_in.priority:
        final_priority = incident_in.priority
    else:
        final_priority = calculate_recommended_priority(incident_in.impact, incident_in.urgency)

    # Calculate SLA Due Time
    sla_due = calculate_sla_due_time(final_priority)

    new_inc = Incident(
        incident_number=inc_number,
        title=incident_in.title,
        description=incident_in.description,
        category=incident_in.category,
        subcategory=incident_in.subcategory,
        impact=incident_in.impact,
        urgency=incident_in.urgency,
        priority=final_priority,
        status=StatusEnum.NEW,
        source="Web Portal",
        reporter_id=current_user.id,
        assigned_team_id=incident_in.assigned_team_id,
        affected_service=incident_in.affected_service,
        affected_asset_id=incident_in.affected_asset_id,
        sla_due_at=sla_due,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(new_inc)
    await db.flush()

    # Record Timeline History
    history = IncidentHistory(
        incident_id=new_inc.id,
        changed_by_id=current_user.id,
        field_changed="Incident Created",
        old_value=None,
        new_value=f"Created ticket {inc_number} with priority {final_priority.value}"
    )
    db.add(history)
    await db.commit()

    # Re-query with eager relationships for output schema
    stmt = select(Incident).options(
        selectinload(Incident.reporter),
        selectinload(Incident.assignee),
        selectinload(Incident.assigned_team),
        selectinload(Incident.affected_asset)
    ).where(Incident.id == new_inc.id)
    out_res = await db.execute(stmt)
    return out_res.scalars().first()

@router.get("", response_model=List[IncidentResponse], summary="List & Filter Incidents")
async def list_incidents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: Optional[str] = Query(None),
    priority: Optional[PriorityEnum] = Query(None),
    status_filter: Optional[StatusEnum] = Query(None, alias="status"),
    category: Optional[str] = Query(None),
    team_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100)
):
    stmt = select(Incident).options(
        selectinload(Incident.reporter),
        selectinload(Incident.assignee),
        selectinload(Incident.assigned_team),
        selectinload(Incident.affected_asset)
    )

    # RBAC filtering: End User can only view their own incidents
    if current_user.role and current_user.role.name == "END_USER":
        stmt = stmt.where(Incident.reporter_id == current_user.id)

    if priority:
        stmt = stmt.where(Incident.priority == priority)
    if status_filter:
        stmt = stmt.where(Incident.status == status_filter)
    if category:
        stmt = stmt.where(Incident.category == category)
    if team_id:
        stmt = stmt.where(Incident.assigned_team_id == team_id)

    if search:
        search_fmt = f"%{search}%"
        stmt = stmt.where(
            or_(
                Incident.incident_number.ilike(search_fmt),
                Incident.title.ilike(search_fmt),
                Incident.description.ilike(search_fmt)
            )
        )

    stmt = stmt.order_by(Incident.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{id}", response_model=IncidentResponse, summary="Get Incident Details by ID")
async def get_incident(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Incident).options(
        selectinload(Incident.reporter),
        selectinload(Incident.assignee),
        selectinload(Incident.assigned_team),
        selectinload(Incident.affected_asset)
    ).where(or_(Incident.id == id, Incident.incident_number == id))
    result = await db.execute(stmt)
    incident = result.scalars().first()

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # End User access check
    if current_user.role and current_user.role.name == "END_USER" and incident.reporter_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have access to view this incident.")

    return incident

@router.put("/{id}", response_model=IncidentResponse, summary="Update Incident Details")
async def update_incident(
    id: str,
    incident_in: IncidentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Incident).options(
        selectinload(Incident.reporter),
        selectinload(Incident.assignee),
        selectinload(Incident.assigned_team),
        selectinload(Incident.affected_asset)
    ).where(Incident.id == id)
    result = await db.execute(stmt)
    incident = result.scalars().first()

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    for field, val in incident_in.dict(exclude_unset=True).items():
        setattr(incident, field, val)

    incident.updated_at = datetime.utcnow()

    history = IncidentHistory(
        incident_id=incident.id,
        changed_by_id=current_user.id,
        field_changed="Incident Details Updated",
        old_value=None,
        new_value="Updated title, description, or parameters"
    )
    db.add(history)
    await db.commit()
    await db.refresh(incident)
    return incident

@router.delete("/{id}", summary="Delete Incident")
async def delete_incident(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users.manage"))
):
    stmt = select(Incident).where(Incident.id == id)
    result = await db.execute(stmt)
    incident = result.scalars().first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    await db.delete(incident)
    await db.commit()
    return {"message": f"Incident {id} deleted successfully"}

@router.patch("/{id}/status", response_model=IncidentResponse, summary="Update Incident Lifecycle Status")
async def update_status(
    id: str,
    status_in: IncidentStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Incident).options(
        selectinload(Incident.reporter),
        selectinload(Incident.assignee),
        selectinload(Incident.assigned_team),
        selectinload(Incident.affected_asset)
    ).where(Incident.id == id)
    result = await db.execute(stmt)
    incident = result.scalars().first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    old_status = incident.status.value
    incident.status = status_in.status

    if status_in.status == StatusEnum.RESOLVED:
        incident.resolved_at = datetime.utcnow()
        if status_in.resolution_notes:
            incident.resolution_notes = status_in.resolution_notes

    if status_in.status == StatusEnum.CLOSED:
        incident.closed_at = datetime.utcnow()

    incident.updated_at = datetime.utcnow()

    history = IncidentHistory(
        incident_id=incident.id,
        changed_by_id=current_user.id,
        field_changed="Status",
        old_value=old_status,
        new_value=status_in.status.value
    )
    db.add(history)
    await db.commit()
    res = await db.execute(
        select(Incident).options(
            selectinload(Incident.reporter),
            selectinload(Incident.assignee),
            selectinload(Incident.assigned_team),
            selectinload(Incident.affected_asset)
        ).where(Incident.id == id)
    )
    return res.scalars().first()

@router.patch("/{id}/assign", response_model=IncidentResponse, summary="Assign Incident to Team/Agent")
async def assign_incident(
    id: str,
    assign_in: IncidentAssignUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Incident).options(
        selectinload(Incident.reporter),
        selectinload(Incident.assignee),
        selectinload(Incident.assigned_team),
        selectinload(Incident.affected_asset)
    ).where(Incident.id == id)
    result = await db.execute(stmt)
    incident = result.scalars().first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    old_team = incident.assigned_team.name if incident.assigned_team else "Unassigned"
    
    if assign_in.assigned_team_id:
        incident.assigned_team_id = assign_in.assigned_team_id
    if assign_in.assigned_agent_id:
        incident.assigned_agent_id = assign_in.assigned_agent_id

    if incident.status == StatusEnum.NEW:
        incident.status = StatusEnum.ASSIGNED

    incident.updated_at = datetime.utcnow()

    history = IncidentHistory(
        incident_id=incident.id,
        changed_by_id=current_user.id,
        field_changed="Assignment",
        old_value=old_team,
        new_value="Reassigned team/agent"
    )
    db.add(history)

    # Notify assigned user
    if assign_in.assigned_agent_id:
        notif = Notification(
            user_id=assign_in.assigned_agent_id,
            title="Incident Assigned",
            message=f"Incident {incident.incident_number} has been assigned to you."
        )
        db.add(notif)

    await db.commit()
    res = await db.execute(
        select(Incident).options(
            selectinload(Incident.reporter),
            selectinload(Incident.assignee),
            selectinload(Incident.assigned_team),
            selectinload(Incident.affected_asset)
        ).where(Incident.id == id)
    )
    return res.scalars().first()

@router.patch("/{id}/priority", response_model=IncidentResponse, summary="Update Incident Priority")
async def update_priority(
    id: str,
    priority_in: IncidentPriorityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Incident).options(
        selectinload(Incident.reporter),
        selectinload(Incident.assignee),
        selectinload(Incident.assigned_team),
        selectinload(Incident.affected_asset)
    ).where(Incident.id == id)
    result = await db.execute(stmt)
    incident = result.scalars().first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    old_prio = incident.priority.value
    incident.priority = priority_in.priority
    if priority_in.impact:
        incident.impact = priority_in.impact
    if priority_in.urgency:
        incident.urgency = priority_in.urgency

    # Recalculate SLA due date
    incident.sla_due_at = calculate_sla_due_time(priority_in.priority, incident.created_at)
    incident.updated_at = datetime.utcnow()

    history = IncidentHistory(
        incident_id=incident.id,
        changed_by_id=current_user.id,
        field_changed="Priority",
        old_value=old_prio,
        new_value=priority_in.priority.value
    )
    db.add(history)
    await db.commit()
    res = await db.execute(
        select(Incident).options(
            selectinload(Incident.reporter),
            selectinload(Incident.assignee),
            selectinload(Incident.assigned_team),
            selectinload(Incident.affected_asset)
        ).where(Incident.id == id)
    )
    return res.scalars().first()

@router.post("/{id}/comments", response_model=IncidentCommentResponse, summary="Add Incident Comment")
async def add_comment(
    id: str,
    comment_in: IncidentCommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Incident).where(Incident.id == id)
    result = await db.execute(stmt)
    incident = result.scalars().first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    comment = IncidentComment(
        incident_id=incident.id,
        author_id=current_user.id,
        content=comment_in.content,
        is_internal=comment_in.is_internal,
        created_at=datetime.utcnow()
    )
    db.add(comment)

    history = IncidentHistory(
        incident_id=incident.id,
        changed_by_id=current_user.id,
        field_changed="Comment Added",
        old_value=None,
        new_value=f"Added comment: {comment_in.content[:50]}..."
    )
    db.add(history)

    await db.commit()
    await db.refresh(comment)

    # Re-query with eager author
    c_stmt = select(IncidentComment).options(selectinload(IncidentComment.author)).where(IncidentComment.id == comment.id)
    res = await db.execute(c_stmt)
    return res.scalars().first()

@router.get("/{id}/comments", response_model=List[IncidentCommentResponse], summary="List Incident Comments")
async def list_comments(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(IncidentComment).options(
        selectinload(IncidentComment.author)
    ).where(IncidentComment.incident_id == id).order_by(IncidentComment.created_at.asc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{id}/history", response_model=List[IncidentHistoryResponse], summary="Get Incident Timeline History")
async def list_history(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(IncidentHistory).options(
        selectinload(IncidentHistory.changed_by)
    ).where(IncidentHistory.incident_id == id).order_by(IncidentHistory.timestamp.asc())
    result = await db.execute(stmt)
    return result.scalars().all()
