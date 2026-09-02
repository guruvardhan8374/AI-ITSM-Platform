from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, or_
from sqlalchemy.orm import selectinload

from app.database.session import get_db
from app.api.deps import get_current_user, require_permission
from app.models.domain_models import (
    ServiceRequest, ServiceCatalog, ServiceRequestHistory, User, Team, Notification, RequestStatusEnum, PriorityEnum
)
from app.schemas.service_request import (
    ServiceRequestCreate, ServiceRequestResponse, ServiceRequestApproval, 
    ServiceRequestStatusUpdate, ServiceRequestHistoryResponse, ServiceCatalogResponse
)

router = APIRouter()

@router.get("/catalog", response_model=List[ServiceCatalogResponse], summary="List Service Catalog Items")
async def get_service_catalog(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(ServiceCatalog).where(ServiceCatalog.status == "Active")
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("", response_model=ServiceRequestResponse, status_code=status.HTTP_201_CREATED, summary="Create Service Request")
async def create_service_request(
    request_in: ServiceRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Auto-generate REQ-xxxx
    count_stmt = select(func.count(ServiceRequest.id))
    res = await db.execute(count_stmt)
    total_count = res.scalar() or 0
    req_number = f"REQ-{1001 + total_count}"

    # Check Service Catalog approval requirements
    approval_needed = False
    if request_in.service_id:
        c_stmt = select(ServiceCatalog).where(ServiceCatalog.id == request_in.service_id)
        c_res = await db.execute(c_stmt)
        cat_item = c_res.scalars().first()
        if cat_item:
            approval_needed = cat_item.approval_required

    initial_status = RequestStatusEnum.APPROVAL_REQUIRED if approval_needed else RequestStatusEnum.APPROVED
    app_status = "PENDING" if approval_needed else "NOT_REQUIRED"

    new_req = ServiceRequest(
        request_number=req_number,
        title=request_in.title,
        description=request_in.description,
        service_id=request_in.service_id,
        requested_by_id=current_user.id,
        department_id=current_user.department_id,
        business_unit_id=current_user.business_unit_id,
        assigned_team_id=request_in.assigned_team_id,
        priority=request_in.priority or PriorityEnum.MEDIUM,
        status=initial_status,
        approval_status=app_status,
        additional_info=request_in.additional_info,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(new_req)
    await db.flush()

    # Record Audit History
    history = ServiceRequestHistory(
        request_id=new_req.id,
        changed_by_id=current_user.id,
        field_changed="Request Created",
        old_value=None,
        new_value=f"Submitted request {req_number} (Approval required: {approval_needed})"
    )
    db.add(history)

    # Notify Manager if approval required
    if approval_needed:
        # Send notification record
        notif = Notification(
            user_id=current_user.id,
            title="Service Request Submitted",
            message=f"Your request {req_number} has been submitted and is pending approval."
        )
        db.add(notif)

    await db.commit()

    stmt = select(ServiceRequest).options(
        selectinload(ServiceRequest.service),
        selectinload(ServiceRequest.requester),
        selectinload(ServiceRequest.approver),
        selectinload(ServiceRequest.assigned_team),
        selectinload(ServiceRequest.assignee)
    ).where(ServiceRequest.id == new_req.id)
    out_res = await db.execute(stmt)
    return out_res.scalars().first()

@router.get("", response_model=List[ServiceRequestResponse], summary="List Service Requests")
async def list_service_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: Optional[str] = Query(None),
    status_filter: Optional[RequestStatusEnum] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100)
):
    stmt = select(ServiceRequest).options(
        selectinload(ServiceRequest.service),
        selectinload(ServiceRequest.requester),
        selectinload(ServiceRequest.approver),
        selectinload(ServiceRequest.assigned_team),
        selectinload(ServiceRequest.assignee)
    )

    # RBAC filter: End User can only view own requests
    if current_user.role and current_user.role.name == "END_USER":
        stmt = stmt.where(ServiceRequest.requested_by_id == current_user.id)

    if status_filter:
        stmt = stmt.where(ServiceRequest.status == status_filter)

    if search:
        search_fmt = f"%{search}%"
        stmt = stmt.where(
            or_(
                ServiceRequest.request_number.ilike(search_fmt),
                ServiceRequest.title.ilike(search_fmt),
                ServiceRequest.description.ilike(search_fmt)
            )
        )

    stmt = stmt.order_by(ServiceRequest.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/{id}", response_model=ServiceRequestResponse, summary="Get Service Request Details")
async def get_service_request(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(ServiceRequest).options(
        selectinload(ServiceRequest.service),
        selectinload(ServiceRequest.requester),
        selectinload(ServiceRequest.approver),
        selectinload(ServiceRequest.assigned_team),
        selectinload(ServiceRequest.assignee)
    ).where(or_(ServiceRequest.id == id, ServiceRequest.request_number == id))
    res = await db.execute(stmt)
    req = res.scalars().first()

    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")

    return req

@router.post("/{id}/approve", response_model=ServiceRequestResponse, summary="Approve Service Request")
async def approve_service_request(
    id: str,
    app_in: ServiceRequestApproval,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(ServiceRequest).options(
        selectinload(ServiceRequest.service),
        selectinload(ServiceRequest.requester),
        selectinload(ServiceRequest.approver),
        selectinload(ServiceRequest.assigned_team),
        selectinload(ServiceRequest.assignee)
    ).where(ServiceRequest.id == id)
    res = await db.execute(stmt)
    req = res.scalars().first()

    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")

    req.approval_status = "APPROVED"
    req.status = RequestStatusEnum.APPROVED
    req.approver_id = current_user.id
    req.approval_decision_at = datetime.utcnow()
    req.approval_comments = app_in.comments
    req.updated_at = datetime.utcnow()

    history = ServiceRequestHistory(
        request_id=req.id,
        changed_by_id=current_user.id,
        field_changed="Approval Status",
        old_value="PENDING",
        new_value=f"APPROVED by {current_user.full_name}"
    )
    db.add(history)

    # Notify requester
    notif = Notification(
        user_id=req.requested_by_id,
        title="Service Request Approved",
        message=f"Your request {req.request_number} has been approved and moved to fulfillment."
    )
    db.add(notif)

    await db.commit()
    await db.refresh(req)
    return req

@router.post("/{id}/reject", response_model=ServiceRequestResponse, summary="Reject Service Request")
async def reject_service_request(
    id: str,
    app_in: ServiceRequestApproval,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(ServiceRequest).options(
        selectinload(ServiceRequest.service),
        selectinload(ServiceRequest.requester),
        selectinload(ServiceRequest.approver),
        selectinload(ServiceRequest.assigned_team),
        selectinload(ServiceRequest.assignee)
    ).where(ServiceRequest.id == id)
    res = await db.execute(stmt)
    req = res.scalars().first()

    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")

    req.approval_status = "REJECTED"
    req.status = RequestStatusEnum.REJECTED
    req.approver_id = current_user.id
    req.approval_decision_at = datetime.utcnow()
    req.approval_comments = app_in.comments
    req.updated_at = datetime.utcnow()

    history = ServiceRequestHistory(
        request_id=req.id,
        changed_by_id=current_user.id,
        field_changed="Approval Status",
        old_value="PENDING",
        new_value=f"REJECTED by {current_user.full_name}: {app_in.comments}"
    )
    db.add(history)

    notif = Notification(
        user_id=req.requested_by_id,
        title="Service Request Rejected",
        message=f"Your request {req.request_number} was rejected."
    )
    db.add(notif)

    await db.commit()
    await db.refresh(req)
    return req

@router.patch("/{id}/status", response_model=ServiceRequestResponse, summary="Update Request Status Workflow")
async def update_request_status(
    id: str,
    status_in: ServiceRequestStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(ServiceRequest).options(
        selectinload(ServiceRequest.service),
        selectinload(ServiceRequest.requester),
        selectinload(ServiceRequest.approver),
        selectinload(ServiceRequest.assigned_team),
        selectinload(ServiceRequest.assignee)
    ).where(ServiceRequest.id == id)
    res = await db.execute(stmt)
    req = res.scalars().first()

    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")

    old_status = req.status.value
    req.status = status_in.status

    if status_in.status == RequestStatusEnum.COMPLETED:
        req.completed_at = datetime.utcnow()

    req.updated_at = datetime.utcnow()

    history = ServiceRequestHistory(
        request_id=req.id,
        changed_by_id=current_user.id,
        field_changed="Status",
        old_value=old_status,
        new_value=status_in.status.value
    )
    db.add(history)
    await db.commit()
    await db.refresh(req)
    return req

@router.get("/{id}/history", response_model=List[ServiceRequestHistoryResponse], summary="Service Request Timeline History")
async def get_request_history(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(ServiceRequestHistory).options(
        selectinload(ServiceRequestHistory.changed_by)
    ).where(ServiceRequestHistory.request_id == id).order_by(ServiceRequestHistory.timestamp.asc())
    res = await db.execute(stmt)
    return res.scalars().all()
