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
    Problem, Incident, ProblemHistory, User, Team, Asset, ProblemStatusEnum, PriorityEnum, problem_incidents
)
from app.schemas.problem import (
    ProblemCreate, ProblemUpdate, ProblemResponse, ProblemLinkIncident, ProblemHistoryResponse,
    AIDetectProblemItem, AIProblemAnalysisResponse
)

router = APIRouter()

@router.post("", response_model=ProblemResponse, status_code=status.HTTP_201_CREATED, summary="Create Problem Record")
async def create_problem(
    problem_in: ProblemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Auto-generate PRB-xxxx
    count_stmt = select(func.count(Problem.id))
    res = await db.execute(count_stmt)
    total_count = res.scalar() or 0
    prb_number = f"PRB-{1001 + total_count}"

    new_prb = Problem(
        problem_number=prb_number,
        title=problem_in.title,
        description=problem_in.description,
        priority=problem_in.priority or PriorityEnum.HIGH,
        status=ProblemStatusEnum.OPEN,
        root_cause=problem_in.root_cause,
        symptoms=problem_in.symptoms,
        workaround=problem_in.workaround,
        permanent_fix=problem_in.permanent_fix,
        known_error=problem_in.known_error,
        affected_service=problem_in.affected_service,
        assigned_team_id=problem_in.assigned_team_id,
        created_by_id=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(new_prb)
    await db.flush()

    history = ProblemHistory(
        problem_id=new_prb.id,
        changed_by_id=current_user.id,
        field_changed="Problem Created",
        old_value=None,
        new_value=f"Registered Problem {prb_number}"
    )
    db.add(history)
    await db.commit()

    stmt = select(Problem).options(
        selectinload(Problem.created_by),
        selectinload(Problem.assigned_team),
        selectinload(Problem.assignee),
        selectinload(Problem.affected_asset),
        selectinload(Problem.incidents).selectinload(Incident.reporter)
    ).where(Problem.id == new_prb.id)
    out_res = await db.execute(stmt)
    return out_res.scalars().first()

@router.get("", response_model=List[ProblemResponse], summary="List & Filter Problems")
async def list_problems(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: Optional[str] = Query(None),
    status_filter: Optional[ProblemStatusEnum] = Query(None, alias="status"),
    priority: Optional[PriorityEnum] = Query(None),
    known_error: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100)
):
    stmt = select(Problem).options(
        selectinload(Problem.created_by),
        selectinload(Problem.assigned_team),
        selectinload(Problem.assignee),
        selectinload(Problem.affected_asset),
        selectinload(Problem.incidents).selectinload(Incident.reporter)
    )

    if status_filter:
        stmt = stmt.where(Problem.status == status_filter)
    if priority:
        stmt = stmt.where(Problem.priority == priority)
    if known_error is not None:
        stmt = stmt.where(Problem.known_error == known_error)

    if search:
        search_fmt = f"%{search}%"
        stmt = stmt.where(
            or_(
                Problem.problem_number.ilike(search_fmt),
                Problem.title.ilike(search_fmt),
                Problem.description.ilike(search_fmt),
                Problem.root_cause.ilike(search_fmt)
            )
        )

    stmt = stmt.order_by(Problem.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/{id}", response_model=ProblemResponse, summary="Get Problem Record Details")
async def get_problem(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Problem).options(
        selectinload(Problem.created_by),
        selectinload(Problem.assigned_team),
        selectinload(Problem.assignee),
        selectinload(Problem.affected_asset),
        selectinload(Problem.incidents).selectinload(Incident.reporter)
    ).where(or_(Problem.id == id, Problem.problem_number == id))
    res = await db.execute(stmt)
    prb = res.scalars().first()

    if not prb:
        raise HTTPException(status_code=404, detail="Problem record not found")

    return prb

@router.put("/{id}", response_model=ProblemResponse, summary="Update Problem Details")
async def update_problem(
    id: str,
    problem_in: ProblemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Problem).options(
        selectinload(Problem.created_by),
        selectinload(Problem.assigned_team),
        selectinload(Problem.assignee),
        selectinload(Problem.affected_asset),
        selectinload(Problem.incidents).selectinload(Incident.reporter)
    ).where(Problem.id == id)
    res = await db.execute(stmt)
    prb = res.scalars().first()
    if not prb:
        raise HTTPException(status_code=404, detail="Problem record not found")

    for field, val in problem_in.dict(exclude_unset=True).items():
        setattr(prb, field, val)

    if problem_in.status == ProblemStatusEnum.RESOLVED:
        prb.resolved_at = datetime.utcnow()

    prb.updated_at = datetime.utcnow()

    history = ProblemHistory(
        problem_id=prb.id,
        changed_by_id=current_user.id,
        field_changed="Details Updated",
        old_value=None,
        new_value="Updated problem metadata or status"
    )
    db.add(history)

    await db.commit()
    await db.refresh(prb)
    return prb

@router.post("/{id}/incidents", response_model=ProblemResponse, summary="Link Incident to Problem Record")
async def link_incident(
    id: str,
    link_in: ProblemLinkIncident,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Problem).options(
        selectinload(Problem.created_by),
        selectinload(Problem.assigned_team),
        selectinload(Problem.assignee),
        selectinload(Problem.affected_asset),
        selectinload(Problem.incidents).selectinload(Incident.reporter)
    ).where(Problem.id == id)
    res = await db.execute(stmt)
    prb = res.scalars().first()
    if not prb:
        raise HTTPException(status_code=404, detail="Problem record not found")

    inc_stmt = select(Incident).where(or_(Incident.id == link_in.incident_id, Incident.incident_number == link_in.incident_id))
    inc_res = await db.execute(inc_stmt)
    inc = inc_res.scalars().first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    if inc not in prb.incidents:
        prb.incidents.append(inc)

    history = ProblemHistory(
        problem_id=prb.id,
        changed_by_id=current_user.id,
        field_changed="Linked Incident",
        old_value=None,
        new_value=f"Linked {inc.incident_number}"
    )
    db.add(history)

    await db.commit()
    await db.refresh(prb)
    return prb

@router.delete("/{id}/incidents/{incident_id}", response_model=ProblemResponse, summary="Unlink Incident from Problem Record")
async def unlink_incident(
    id: str,
    incident_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Problem).options(
        selectinload(Problem.created_by),
        selectinload(Problem.assigned_team),
        selectinload(Problem.assignee),
        selectinload(Problem.affected_asset),
        selectinload(Problem.incidents).selectinload(Incident.reporter)
    ).where(Problem.id == id)
    res = await db.execute(stmt)
    prb = res.scalars().first()
    if not prb:
        raise HTTPException(status_code=404, detail="Problem record not found")

    inc_to_remove = [inc for inc in prb.incidents if inc.id == incident_id or inc.incident_number == incident_id]
    for inc in inc_to_remove:
        prb.incidents.remove(inc)

    history = ProblemHistory(
        problem_id=prb.id,
        changed_by_id=current_user.id,
        field_changed="Unlinked Incident",
        old_value=None,
        new_value=f"Unlinked incident {incident_id}"
    )
    db.add(history)

    await db.commit()
    await db.refresh(prb)
    return prb

@router.get("/{id}/history", response_model=List[ProblemHistoryResponse], summary="Get Problem Timeline History")
async def get_problem_history(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(ProblemHistory).options(
        selectinload(ProblemHistory.changed_by)
    ).where(ProblemHistory.problem_id == id).order_by(ProblemHistory.timestamp.asc())
    res = await db.execute(stmt)
    return res.scalars().all()
