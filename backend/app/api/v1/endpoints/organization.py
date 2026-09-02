from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from typing import List, Optional

from app.database.session import get_db
from app.models.domain_models import User, Role, Permission, BusinessUnit, Department, Team, Incident, AuditLog
from app.schemas.organization import (
    UserSchema, UserCreate, UserUpdate,
    RoleSchema, RoleCreate, RoleUpdate, PermissionSchema,
    BusinessUnitSchema, BusinessUnitCreate,
    DepartmentSchema, DepartmentCreate,
    TeamSchema, TeamCreate
)
from app.core.security import get_password_hash
from app.api.deps import get_current_user

router = APIRouter()

# ==================== USER MANAGEMENT ====================

@router.get("/users", response_model=List[UserSchema], summary="List Enterprise Users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    role_id: Optional[str] = Query(None),
    department_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    stmt = select(User).options(
        selectinload(User.role).selectinload(Role.permissions),
        selectinload(User.department),
        selectinload(User.business_unit)
    )

    if role_id:
        stmt = stmt.where(User.role_id == role_id)
    if department_id:
        stmt = stmt.where(User.department_id == department_id)
    if search:
        stmt = stmt.where(
            User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )

    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/users/{id}", response_model=UserSchema, summary="Get User Details")
async def get_user(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    stmt = select(User).options(
        selectinload(User.role).selectinload(Role.permissions),
        selectinload(User.department),
        selectinload(User.business_unit)
    ).where(User.id == id)
    res = await db.execute(stmt)
    user_item = res.scalar_one_or_none()
    if not user_item:
        raise HTTPException(status_code=404, detail="User not found")
    return user_item

@router.post("/users", response_model=UserSchema, status_code=status.HTTP_201_CREATED, summary="Create New User")
async def create_user(
    input_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role.name != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Only Super Admin can create user accounts.")

    # Check email duplicate
    existing = (await db.execute(select(User).where(User.email == input_data.email))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    new_user = User(
        email=input_data.email,
        full_name=input_data.full_name,
        hashed_password=get_password_hash(input_data.password),
        role_id=input_data.role_id,
        department_id=input_data.department_id,
        business_unit_id=input_data.business_unit_id,
        is_active=True
    )
    db.add(new_user)

    audit = AuditLog(
        user_id=current_user.id,
        action="USER_CREATED",
        module="Organization",
        entity_id=new_user.id,
        details=f"Created user account: {input_data.email}"
    )
    db.add(audit)
    await db.commit()

    return await get_user(new_user.id, db, current_user)

@router.patch("/users/{id}/status", response_model=UserSchema, summary="Activate / Deactivate User")
async def toggle_user_status(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role.name != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Only Super Admin can toggle user status.")

    user_item = (await db.execute(select(User).where(User.id == id))).scalar_one_or_none()
    if not user_item:
        raise HTTPException(status_code=404, detail="User not found")

    user_item.is_active = not user_item.is_active
    audit = AuditLog(
        user_id=current_user.id,
        action="USER_STATUS_UPDATED",
        module="Organization",
        entity_id=user_item.id,
        details=f"Updated user status for {user_item.email} to is_active={user_item.is_active}"
    )
    db.add(audit)
    await db.commit()

    return await get_user(user_item.id, db, current_user)

# ==================== ROLE & PERMISSION MANAGEMENT ====================

@router.get("/permissions", response_model=List[PermissionSchema], summary="List All Permissions")
async def list_permissions(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    res = await db.execute(select(Permission))
    return res.scalars().all()

@router.get("/roles", response_model=List[RoleSchema], summary="List Enterprise Roles")
async def list_roles(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    res = await db.execute(select(Role).options(selectinload(Role.permissions)))
    return res.scalars().all()

@router.get("/roles/{id}", response_model=RoleSchema, summary="Get Role Details")
async def get_role(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    res = await db.execute(select(Role).options(selectinload(Role.permissions)).where(Role.id == id))
    role_item = res.scalar_one_or_none()
    if not role_item:
        raise HTTPException(status_code=404, detail="Role not found")
    return role_item

@router.post("/roles", response_model=RoleSchema, status_code=201, summary="Create Custom Role")
async def create_role(
    input_data: RoleCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role.name != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Only Super Admin can create custom roles.")

    perms = []
    if input_data.permission_ids:
        p_res = await db.execute(select(Permission).where(Permission.id.in_(input_data.permission_ids)))
        perms = p_res.scalars().all()

    new_role = Role(name=input_data.name, description=input_data.description, permissions=perms)
    db.add(new_role)
    await db.commit()

    return await get_role(new_role.id, db, current_user)

@router.put("/roles/{id}", response_model=RoleSchema, summary="Update Role Permissions")
async def update_role(
    id: str,
    input_data: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role.name != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Only Super Admin can update roles.")

    role_item = (await db.execute(select(Role).options(selectinload(Role.permissions)).where(Role.id == id))).scalar_one_or_none()
    if not role_item:
        raise HTTPException(status_code=404, detail="Role not found")

    if role_item.name == "SUPER_ADMIN":
        raise HTTPException(status_code=400, detail="Cannot modify core SUPER_ADMIN role permissions.")

    if input_data.name:
        role_item.name = input_data.name
    if input_data.description is not None:
        role_item.description = input_data.description

    if input_data.permission_ids is not None:
        p_res = await db.execute(select(Permission).where(Permission.id.in_(input_data.permission_ids)))
        role_item.permissions = p_res.scalars().all()

    audit = AuditLog(
        user_id=current_user.id,
        action="ROLE_UPDATED",
        module="Governance",
        entity_id=role_item.id,
        details=f"Updated permissions for role {role_item.name}"
    )
    db.add(audit)
    await db.commit()

    return await get_role(role_item.id, db, current_user)

# ==================== BUSINESS UNITS ====================

@router.get("/business-units", response_model=List[BusinessUnitSchema], summary="List Business Units")
async def list_business_units(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    res = await db.execute(select(BusinessUnit))
    bu_list = res.scalars().all()

    output = []
    for bu in bu_list:
        dept_cnt = (await db.execute(select(func.count(Department.id)).where(Department.business_unit_id == bu.id))).scalar() or 0
        usr_cnt = (await db.execute(select(func.count(User.id)).where(User.business_unit_id == bu.id))).scalar() or 0
        output.append({
            "id": bu.id,
            "name": bu.name,
            "description": bu.description,
            "departments_count": dept_cnt,
            "users_count": usr_cnt
        })
    return output

@router.post("/business-units", response_model=BusinessUnitSchema, status_code=201, summary="Create Business Unit")
async def create_business_unit(
    input_data: BusinessUnitCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    bu = BusinessUnit(name=input_data.name, description=input_data.description)
    db.add(bu)
    await db.commit()
    return {"id": bu.id, "name": bu.name, "description": bu.description, "departments_count": 0, "users_count": 0}

# ==================== DEPARTMENTS ====================

@router.get("/departments", response_model=List[DepartmentSchema], summary="List IT Departments")
async def list_departments(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    res = await db.execute(select(Department).options(selectinload(Department.business_unit)))
    dept_list = res.scalars().all()

    output = []
    for d in dept_list:
        t_cnt = (await db.execute(select(func.count(Team.id)).where(Team.department_id == d.id))).scalar() or 0
        u_cnt = (await db.execute(select(func.count(User.id)).where(User.department_id == d.id))).scalar() or 0
        output.append({
            "id": d.id,
            "name": d.name,
            "business_unit_id": d.business_unit_id,
            "business_unit_name": d.business_unit.name if d.business_unit else "Enterprise BU",
            "teams_count": t_cnt,
            "users_count": u_cnt
        })
    return output

@router.post("/departments", response_model=DepartmentSchema, status_code=201, summary="Create Department")
async def create_department(
    input_data: DepartmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    d = Department(name=input_data.name, business_unit_id=input_data.business_unit_id)
    db.add(d)
    await db.commit()
    return {"id": d.id, "name": d.name, "business_unit_id": d.business_unit_id, "business_unit_name": "Enterprise", "teams_count": 0, "users_count": 0}

# ==================== SUPPORT TEAMS ====================

@router.get("/teams", response_model=List[TeamSchema], summary="List Support Teams")
async def list_teams(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    res = await db.execute(select(Team).options(selectinload(Team.department)))
    team_list = res.scalars().all()

    output = []
    for t in team_list:
        inc_cnt = (await db.execute(select(func.count(Incident.id)).where(Incident.assigned_team_id == t.id, Incident.status != "Resolved"))).scalar() or 0
        output.append({
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "department_id": t.department_id,
            "department_name": t.department.name if t.department else "IT Operations",
            "lead_name": "Senior Lead",
            "members_count": 4,
            "open_incidents_count": inc_cnt
        })
    return output

@router.get("/teams/{id}", response_model=TeamSchema, summary="Get Support Team Details")
async def get_team(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    res = await db.execute(select(Team).options(selectinload(Team.department)).where(Team.id == id))
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Support team not found")
    inc_cnt = (await db.execute(select(func.count(Incident.id)).where(Incident.assigned_team_id == t.id, Incident.status != "Resolved"))).scalar() or 0
    return {
        "id": t.id,
        "name": t.name,
        "description": t.description,
        "department_id": t.department_id,
        "department_name": t.department.name if t.department else "IT Operations",
        "lead_name": "Senior Lead",
        "members_count": 4,
        "open_incidents_count": inc_cnt
    }

@router.post("/teams", response_model=TeamSchema, status_code=201, summary="Create Support Team")
async def create_team(
    input_data: TeamCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    t = Team(name=input_data.name, description=input_data.description, department_id=input_data.department_id)
    db.add(t)
    await db.commit()
    return {"id": t.id, "name": t.name, "description": t.description, "department_id": t.department_id, "department_name": "IT Operations", "lead_name": "Senior Lead", "members_count": 1, "open_incidents_count": 0}
