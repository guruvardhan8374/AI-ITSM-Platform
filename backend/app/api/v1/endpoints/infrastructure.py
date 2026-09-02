import random
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func

from app.database.session import get_db
from app.models.domain_models import (
    InfrastructureResource, InfrastructureMetric, InfrastructureAlert, Incident, User, Team, Notification, AuditLog, PriorityEnum, StatusEnum
)
from app.schemas.infrastructure import (
    InfraResourceCreateRequest, InfraResourceResponse, InfraMetricResponse, InfraAlertResponse
)
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[InfraResourceResponse], summary="List Infrastructure Resources")
async def list_infrastructure_resources(
    resource_type: Optional[str] = Query(None),
    environment: Optional[str] = Query(None),
    health: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(InfrastructureResource)
        .options(
            selectinload(InfrastructureResource.alerts).selectinload(InfrastructureAlert.acknowledged_by),
            selectinload(InfrastructureResource.alerts).selectinload(InfrastructureAlert.incident)
        )
        .order_by(InfrastructureResource.name.asc())
    )

    if resource_type:
        stmt = stmt.where(InfrastructureResource.resource_type == resource_type)
    if environment:
        stmt = stmt.where(InfrastructureResource.environment == environment)
    if health:
        stmt = stmt.where(InfrastructureResource.health == health)

    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/{id}", response_model=InfraResourceResponse, summary="Get Infrastructure Resource Details")
async def get_infrastructure_resource(id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(InfrastructureResource)
        .options(
            selectinload(InfrastructureResource.alerts).selectinload(InfrastructureAlert.acknowledged_by),
            selectinload(InfrastructureResource.alerts).selectinload(InfrastructureAlert.incident)
        )
        .where((InfrastructureResource.id == id) | (InfrastructureResource.resource_number == id))
    )
    res = await db.execute(stmt)
    resource = res.scalars().first()
    if not resource:
        raise HTTPException(status_code=404, detail="Infrastructure resource not found")
    return resource

@router.get("/{id}/metrics", response_model=List[InfraMetricResponse], summary="Get Infrastructure Metrics History")
async def get_resource_metrics(
    id: str,
    limit: int = Query(30, ge=5, le=100),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(InfrastructureMetric)
        .where(InfrastructureMetric.resource_id == id)
        .order_by(InfrastructureMetric.timestamp.asc())
        .limit(limit)
    )
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/{id}/alerts", response_model=List[InfraAlertResponse], summary="Get Resource Alerts")
async def get_resource_alerts(id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(InfrastructureAlert)
        .options(
            selectinload(InfrastructureAlert.acknowledged_by),
            selectinload(InfrastructureAlert.incident)
        )
        .where(InfrastructureAlert.resource_id == id)
        .order_by(InfrastructureAlert.created_at.desc())
    )
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("", response_model=InfraResourceResponse, summary="Create Infrastructure Resource")
async def create_infrastructure_resource(
    res_in: InfraResourceCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count_res = await db.execute(select(func.count(InfrastructureResource.id)))
    count = count_res.scalar() or 0
    res_number = f"INF-{1001 + count}"

    resource = InfrastructureResource(
        resource_number=res_number,
        name=res_in.name,
        resource_type=res_in.resource_type,
        ip_address=res_in.ip_address or f"10.0.4.{10 + count}",
        environment=res_in.environment,
        status=res_in.status,
        health=res_in.health,
        cpu_percent=res_in.cpu_percent,
        memory_percent=res_in.memory_percent,
        disk_percent=res_in.disk_percent,
        network_mbps=res_in.network_mbps,
        response_time_ms=res_in.response_time_ms,
        availability_percent=res_in.availability_percent,
        last_check_at=datetime.utcnow()
    )
    db.add(resource)
    await db.flush()

    # Initial metric snapshot
    metric = InfrastructureMetric(
        resource_id=resource.id,
        cpu_percent=resource.cpu_percent,
        memory_percent=resource.memory_percent,
        disk_percent=resource.disk_percent,
        network_mbps=resource.network_mbps,
        response_time_ms=resource.response_time_ms,
        availability_percent=resource.availability_percent,
        timestamp=datetime.utcnow()
    )
    db.add(metric)

    audit = AuditLog(
        user_id=current_user.id,
        action="INFRA_RESOURCE_CREATED",
        module="Infrastructure",
        entity_id=resource.id,
        details=f"Registered Infrastructure Resource {res_number} ({resource.name})"
    )
    db.add(audit)

    await db.commit()

    res = await db.execute(
        select(InfrastructureResource)
        .options(
            selectinload(InfrastructureResource.alerts).selectinload(InfrastructureAlert.acknowledged_by),
            selectinload(InfrastructureResource.alerts).selectinload(InfrastructureAlert.incident)
        )
        .where(InfrastructureResource.id == resource.id)
    )
    return res.scalars().first()

@router.post("/{id}/check", response_model=InfraResourceResponse, summary="Simulate Infrastructure Monitoring Check & Automated Incident Trigger")
async def trigger_resource_check(
    id: str,
    simulate_spike: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(InfrastructureResource).where(InfrastructureResource.id == id)
    res = await db.execute(stmt)
    resource = res.scalars().first()
    if not resource:
        raise HTTPException(status_code=404, detail="Infrastructure resource not found")

    # Update metric values
    if simulate_spike:
        resource.cpu_percent = random.uniform(92.0, 98.5)
        resource.memory_percent = min(94.0, max(85.0, resource.memory_percent + random.uniform(15.0, 25.0)))
    else:
        # Realistic small fluctuation
        resource.cpu_percent = max(10.0, min(99.0, resource.cpu_percent + random.uniform(-3.0, 3.0)))
        resource.memory_percent = max(20.0, min(99.0, resource.memory_percent + random.uniform(-2.0, 2.0)))
        resource.disk_percent = max(20.0, min(99.0, resource.disk_percent + random.uniform(0.0, 0.5)))

    resource.last_check_at = datetime.utcnow()

    # Determine health state
    if resource.cpu_percent > 90.0 or resource.disk_percent > 90.0 or resource.availability_percent < 99.0:
        resource.health = "CRITICAL"
    elif resource.cpu_percent > 70.0 or resource.memory_percent > 70.0 or resource.disk_percent > 75.0:
        resource.health = "WARNING"
    else:
        resource.health = "HEALTHY"

    # Add metric snapshot
    metric = InfrastructureMetric(
        resource_id=resource.id,
        cpu_percent=resource.cpu_percent,
        memory_percent=resource.memory_percent,
        disk_percent=resource.disk_percent,
        network_mbps=resource.network_mbps,
        response_time_ms=resource.response_time_ms,
        availability_percent=resource.availability_percent,
        timestamp=datetime.utcnow()
    )
    db.add(metric)

    # AUTOMATIC INCIDENT CREATION ON CRITICAL BREACH!
    if resource.health == "CRITICAL":
        alert_count_res = await db.execute(select(func.count(InfrastructureAlert.id)))
        alert_count = alert_count_res.scalar() or 0
        alert_number = f"ALT-{1001 + alert_count}"

        inc_count_res = await db.execute(select(func.count(Incident.id)))
        inc_count = inc_count_res.scalar() or 0
        incident_number = f"INC-{1001 + inc_count}"

        # Find Database or Infrastructure Support Team
        team_stmt = select(Team).where(Team.name.ilike("%Database%") | Team.name.ilike("%Infrastructure%"))
        team_res = await db.execute(team_stmt)
        infra_team = team_res.scalars().first()

        # Create Automatic P1 Incident
        auto_incident = Incident(
            incident_number=incident_number,
            title=f"Critical {resource.resource_type} Threshold Breach on {resource.name}",
            description=f"Automated monitoring alert: {resource.name} ({resource.ip_address}) reached critical CPU utilization ({resource.cpu_percent:.1f}%) and memory ({resource.memory_percent:.1f}%). Immediate NOC investigation required.",
            category="Infrastructure",
            subcategory="Monitoring Threshold Breach",
            priority=PriorityEnum.CRITICAL,
            impact=3,
            urgency=3,
            status=StatusEnum.NEW,
            source="Automated Monitoring Engine",
            reporter_id=current_user.id,
            assigned_team_id=infra_team.id if infra_team else None,
            affected_service=f"{resource.resource_type} Service",
            sla_due_at=datetime.utcnow() + timedelta(hours=1)
        )
        db.add(auto_incident)
        await db.flush()

        # Create Alert linking to the new incident
        alert = InfrastructureAlert(
            alert_number=alert_number,
            resource_id=resource.id,
            metric_name="CPU Utilization",
            current_value=resource.cpu_percent,
            threshold_value=90.0,
            severity="CRITICAL",
            message=f"Critical threshold breach on {resource.name}: CPU {resource.cpu_percent:.1f}% exceeds 90.0%",
            status="OPEN",
            incident_id=auto_incident.id
        )
        db.add(alert)

        # Notify IT Manager & Engineers
        notif = Notification(
            user_id=current_user.id,
            title=f"CRITICAL Alert: {resource.name}",
            message=f"Critical CPU breach detected on {resource.name}. Automatic Incident {incident_number} created."
        )
        db.add(notif)

        audit = AuditLog(
            user_id=current_user.id,
            action="AUTOMATIC_INCIDENT_CREATED",
            module="Infrastructure",
            entity_id=auto_incident.id,
            details=f"Automated Incident {incident_number} generated for Critical Infrastructure Alert {alert_number} on {resource.name}"
        )
        db.add(audit)

    await db.commit()

    res = await db.execute(
        select(InfrastructureResource)
        .options(
            selectinload(InfrastructureResource.alerts).selectinload(InfrastructureAlert.acknowledged_by),
            selectinload(InfrastructureResource.alerts).selectinload(InfrastructureAlert.incident)
        )
        .where(InfrastructureResource.id == id)
    )
    return res.scalars().first()

@router.get("/alerts/all", response_model=List[InfraAlertResponse], summary="List All Infrastructure Alerts")
async def list_all_alerts(
    status_filter: Optional[str] = Query(None, alias="status"),
    severity: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(InfrastructureAlert)
        .options(
            selectinload(InfrastructureAlert.acknowledged_by),
            selectinload(InfrastructureAlert.incident)
        )
        .order_by(InfrastructureAlert.created_at.desc())
    )

    if status_filter:
        stmt = stmt.where(InfrastructureAlert.status == status_filter)
    if severity:
        stmt = stmt.where(InfrastructureAlert.severity == severity)

    res = await db.execute(stmt)
    return res.scalars().all()

@router.patch("/alerts/{id}/acknowledge", response_model=InfraAlertResponse, summary="Acknowledge Infrastructure Alert")
async def acknowledge_alert(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(InfrastructureAlert).where(InfrastructureAlert.id == id)
    res = await db.execute(stmt)
    alert = res.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "ACKNOWLEDGED"
    alert.acknowledged_at = datetime.utcnow()
    alert.acknowledged_by_id = current_user.id

    audit = AuditLog(
        actor_id=current_user.id,
        action="ALERT_ACKNOWLEDGED",
        target_entity="InfrastructureAlert",
        target_id=alert.id,
        details=f"Alert {alert.alert_number} acknowledged by {current_user.full_name}"
    )
    db.add(audit)

    await db.commit()

    res = await db.execute(
        select(InfrastructureAlert)
        .options(
            selectinload(InfrastructureAlert.acknowledged_by),
            selectinload(InfrastructureAlert.incident)
        )
        .where(InfrastructureAlert.id == id)
    )
    return res.scalars().first()

@router.patch("/alerts/{id}/resolve", response_model=InfraAlertResponse, summary="Resolve Infrastructure Alert")
async def resolve_alert(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(InfrastructureAlert).where(InfrastructureAlert.id == id)
    res = await db.execute(stmt)
    alert = res.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "RESOLVED"
    alert.resolved_at = datetime.utcnow()

    audit = AuditLog(
        actor_id=current_user.id,
        action="ALERT_RESOLVED",
        target_entity="InfrastructureAlert",
        target_id=alert.id,
        details=f"Alert {alert.alert_number} resolved by {current_user.full_name}"
    )
    db.add(audit)

    await db.commit()

    res = await db.execute(
        select(InfrastructureAlert)
        .options(
            selectinload(InfrastructureAlert.acknowledged_by),
            selectinload(InfrastructureAlert.incident)
        )
        .where(InfrastructureAlert.id == id)
    )
    return res.scalars().first()
