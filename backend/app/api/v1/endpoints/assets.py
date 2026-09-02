from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func

from app.database.session import get_db
from app.models.domain_models import (
    Asset, AssetMaintenance, AssetHistory, User, Incident, ChangeRequest, AuditLog
)
from app.schemas.asset_management import (
    AssetCreateRequest, AssetUpdateRequest, AssetMaintenanceCreateRequest, AssetResponse, AssetMaintenanceResponse, AssetHistoryResponse, IncidentBasic, ChangeBasic
)
from app.api.deps import get_current_user

router = APIRouter()

@router.post("", response_model=AssetResponse, summary="Create IT Asset")
async def create_asset(
    asset_in: AssetCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Auto generate AST-XXXX
    count_res = await db.execute(select(func.count(Asset.id)))
    count = count_res.scalar() or 0
    asset_number = f"AST-{1001 + count}"

    new_asset = Asset(
        asset_number=asset_number,
        asset_name=asset_in.asset_name,
        asset_type=asset_in.asset_type,
        serial_number=asset_in.serial_number or f"SN-{10000 + count}",
        hostname=asset_in.hostname or f"{asset_in.asset_type.lower().replace(' ', '-')}-{count+1}",
        ip_address=asset_in.ip_address or f"192.168.1.{100 + count}",
        owner_id=asset_in.owner_id or current_user.id,
        department_id=asset_in.department_id,
        business_unit_id=asset_in.business_unit_id,
        team_id=asset_in.team_id,
        location=asset_in.location,
        status=asset_in.status,
        health=asset_in.health,
        criticality=asset_in.criticality,
        manufacturer=asset_in.manufacturer,
        model=asset_in.model,
        purchase_date=asset_in.purchase_date or datetime.utcnow(),
        warranty_expiry=asset_in.warranty_expiry,
        description=asset_in.description
    )
    db.add(new_asset)
    await db.flush()

    db.add(AssetHistory(
        asset_id=new_asset.id,
        changed_by_id=current_user.id,
        field_changed="Status",
        old_value=None,
        new_value=asset_in.status
    ))

    audit = AuditLog(
        user_id=current_user.id,
        action="ASSET_CREATED",
        module="Asset Management",
        entity_id=new_asset.id,
        details=f"Registered IT Asset {asset_number} ({asset_in.asset_name})"
    )
    db.add(audit)

    await db.commit()

    res = await db.execute(
        select(Asset)
        .options(
            selectinload(Asset.owner),
            selectinload(Asset.department),
            selectinload(Asset.incidents),
            selectinload(Asset.changes),
            selectinload(Asset.maintenances).selectinload(AssetMaintenance.performed_by),
            selectinload(Asset.history).selectinload(AssetHistory.changed_by)
        )
        .where(Asset.id == new_asset.id)
    )
    return res.scalars().first()

@router.get("", response_model=List[AssetResponse], summary="List IT Assets")
async def list_assets(
    search: Optional[str] = Query(None),
    asset_type: Optional[str] = Query(None),
    health: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    criticality: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Asset)
        .options(
            selectinload(Asset.owner),
            selectinload(Asset.department),
            selectinload(Asset.incidents),
            selectinload(Asset.changes),
            selectinload(Asset.maintenances).selectinload(AssetMaintenance.performed_by),
            selectinload(Asset.history).selectinload(AssetHistory.changed_by)
        )
        .order_by(Asset.created_at.desc())
    )

    if asset_type:
        stmt = stmt.where(Asset.asset_type == asset_type)
    if health:
        stmt = stmt.where(Asset.health == health)
    if status_filter:
        stmt = stmt.where(Asset.status == status_filter)
    if criticality:
        stmt = stmt.where(Asset.criticality == criticality)

    if search:
        s = f"%{search}%"
        stmt = stmt.where(
            (Asset.asset_number.ilike(s)) |
            (Asset.asset_name.ilike(s)) |
            (Asset.hostname.ilike(s)) |
            (Asset.ip_address.ilike(s))
        )

    stmt = stmt.offset((page - 1) * limit).limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/{id}", response_model=AssetResponse, summary="Get Asset Details")
async def get_asset(id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Asset)
        .options(
            selectinload(Asset.owner),
            selectinload(Asset.department),
            selectinload(Asset.incidents),
            selectinload(Asset.changes),
            selectinload(Asset.maintenances).selectinload(AssetMaintenance.performed_by),
            selectinload(Asset.history).selectinload(AssetHistory.changed_by)
        )
        .where((Asset.id == id) | (Asset.asset_number == id))
    )
    res = await db.execute(stmt)
    asset = res.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@router.put("/{id}", response_model=AssetResponse, summary="Update Asset")
async def update_asset(
    id: str,
    asset_in: AssetUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Asset).where(Asset.id == id)
    res = await db.execute(stmt)
    asset = res.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    for field, val in asset_in.dict(exclude_unset=True).items():
        if val is not None:
            old_val = str(getattr(asset, field, ''))
            setattr(asset, field, val)
            db.add(AssetHistory(
                asset_id=asset.id,
                changed_by_id=current_user.id,
                field_changed=field,
                old_value=old_val,
                new_value=str(val)
            ))

    await db.commit()

    res = await db.execute(
        select(Asset)
        .options(
            selectinload(Asset.owner),
            selectinload(Asset.department),
            selectinload(Asset.incidents),
            selectinload(Asset.changes),
            selectinload(Asset.maintenances).selectinload(AssetMaintenance.performed_by),
            selectinload(Asset.history).selectinload(AssetHistory.changed_by)
        )
        .where(Asset.id == id)
    )
    return res.scalars().first()

@router.patch("/{id}/status", response_model=AssetResponse, summary="Update Asset Status")
async def update_asset_status(
    id: str,
    new_status: str = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Asset).where(Asset.id == id)
    res = await db.execute(stmt)
    asset = res.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    old_status = asset.status
    asset.status = new_status

    db.add(AssetHistory(
        asset_id=asset.id,
        changed_by_id=current_user.id,
        field_changed="Status",
        old_value=old_status,
        new_value=new_status
    ))

    audit = AuditLog(
        actor_id=current_user.id,
        action="ASSET_STATUS_UPDATED",
        target_entity="Asset",
        target_id=asset.id,
        details=f"Asset {asset.asset_number} status changed to {new_status}"
    )
    db.add(audit)

    await db.commit()

    res = await db.execute(
        select(Asset)
        .options(
            selectinload(Asset.owner),
            selectinload(Asset.department),
            selectinload(Asset.incidents),
            selectinload(Asset.changes),
            selectinload(Asset.maintenances).selectinload(AssetMaintenance.performed_by),
            selectinload(Asset.history).selectinload(AssetHistory.changed_by)
        )
        .where(Asset.id == id)
    )
    return res.scalars().first()

@router.patch("/{id}/health", response_model=AssetResponse, summary="Update Asset Health")
async def update_asset_health(
    id: str,
    new_health: str = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Asset).where(Asset.id == id)
    res = await db.execute(stmt)
    asset = res.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    old_health = asset.health
    asset.health = new_health

    db.add(AssetHistory(
        asset_id=asset.id,
        changed_by_id=current_user.id,
        field_changed="Health",
        old_value=old_health,
        new_value=new_health
    ))

    audit = AuditLog(
        actor_id=current_user.id,
        action="ASSET_HEALTH_UPDATED",
        target_entity="Asset",
        target_id=asset.id,
        details=f"Asset {asset.asset_number} health changed from {old_health} to {new_health}"
    )
    db.add(audit)

    await db.commit()

    res = await db.execute(
        select(Asset)
        .options(
            selectinload(Asset.owner),
            selectinload(Asset.department),
            selectinload(Asset.incidents),
            selectinload(Asset.changes),
            selectinload(Asset.maintenances).selectinload(AssetMaintenance.performed_by),
            selectinload(Asset.history).selectinload(AssetHistory.changed_by)
        )
        .where(Asset.id == id)
    )
    return res.scalars().first()

@router.post("/{id}/maintenance", response_model=AssetMaintenanceResponse, summary="Record Maintenance Log")
async def add_asset_maintenance(
    id: str,
    maint_in: AssetMaintenanceCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Asset).where(Asset.id == id)
    res = await db.execute(stmt)
    asset = res.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    maint_count_res = await db.execute(select(func.count(AssetMaintenance.id)))
    maint_count = maint_count_res.scalar() or 0

    maint = AssetMaintenance(
        asset_id=asset.id,
        maintenance_number=f"MNT-{1001 + maint_count}",
        type=maint_in.type,
        description=maint_in.description,
        performed_by_id=current_user.id,
        maintenance_date=datetime.utcnow(),
        result=maint_in.result,
        next_maintenance_date=maint_in.next_maintenance_date
    )
    db.add(maint)

    asset.last_maintenance = datetime.utcnow()

    db.add(AssetHistory(
        asset_id=asset.id,
        changed_by_id=current_user.id,
        field_changed="Maintenance",
        old_value=None,
        new_value=f"Performed {maint_in.type} ({maint_in.result})"
    ))

    await db.commit()

    res = await db.execute(
        select(AssetMaintenance)
        .options(selectinload(AssetMaintenance.performed_by))
        .where(AssetMaintenance.id == maint.id)
    )
    return res.scalars().first()

@router.get("/{id}/incidents", response_model=List[IncidentBasic], summary="Get Related Incidents for Asset")
async def get_asset_incidents(id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Incident).where(Incident.affected_asset_id == id).order_by(Incident.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/{id}/changes", response_model=List[ChangeBasic], summary="Get Related Changes for Asset")
async def get_asset_changes(id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Asset).options(selectinload(Asset.changes)).where(Asset.id == id)
    res = await db.execute(stmt)
    asset = res.scalars().first()
    if not asset:
        return []
    return asset.changes

@router.get("/{id}/history", response_model=List[AssetHistoryResponse], summary="Get Asset History Timeline")
async def get_asset_history(id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(AssetHistory)
        .options(selectinload(AssetHistory.changed_by))
        .where(AssetHistory.asset_id == id)
        .order_by(AssetHistory.timestamp.desc())
    )
    res = await db.execute(stmt)
    return res.scalars().all()
