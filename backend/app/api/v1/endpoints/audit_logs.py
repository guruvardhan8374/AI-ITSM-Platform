from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import Optional, List

from app.database.session import get_db
from app.models.domain_models import AuditLog
from app.schemas.audit_logs import AuditLogSchema
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[AuditLogSchema], summary="List System Audit Logs (Append-Only)")
async def list_audit_logs(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    module: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    # Restrict sensitive audit logs to authorized roles
    if current_user.role.name not in ["SUPER_ADMIN", "IT_MANAGER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only Super Admin and IT Manager roles can access audit logs."
        )

    stmt = select(AuditLog).options(selectinload(AuditLog.user)).order_by(AuditLog.timestamp.desc())

    if module:
        stmt = stmt.where(AuditLog.module == module)
    if action:
        stmt = stmt.where(AuditLog.action == action)
    if search:
        stmt = stmt.where(
            AuditLog.action.ilike(f"%{search}%") |
            AuditLog.details.ilike(f"%{search}%") |
            AuditLog.module.ilike(f"%{search}%")
        )

    offset = (page - 1) * limit
    stmt = stmt.offset(offset).limit(limit)

    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/{id}", response_model=AuditLogSchema, summary="Get Specific Audit Log Record")
async def get_audit_log(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role.name not in ["SUPER_ADMIN", "IT_MANAGER"]:
        raise HTTPException(status_code=403, detail="Access Denied")

    stmt = select(AuditLog).options(selectinload(AuditLog.user)).where(AuditLog.id == id)
    res = await db.execute(stmt)
    audit_item = res.scalar_one_or_none()
    if not audit_item:
        raise HTTPException(status_code=404, detail="Audit log entry not found")
    return audit_item
