from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database.session import get_db
from app.models.domain_models import User, Role, AuditLog
from app.schemas.auth import LoginRequest, Token, UserResponse, UserCreate
from app.core.security import verify_password, get_password_hash, create_access_token
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/login", response_model=Token, summary="User Authentication Login")
async def login(
    request: Request,
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).options(
        selectinload(User.role).selectinload(Role.permissions)
    ).where(User.email == login_data.email)
    result = await db.execute(stmt)
    user = result.scalars().first()

    client_ip = request.client.host if request.client else "unknown"

    if not user or not verify_password(login_data.password, user.hashed_password):
        # Audit failed login
        audit = AuditLog(
            user_id=user.id if user else None,
            action="LOGIN_FAILED",
            module="Authentication",
            details=f"Failed login attempt for email {login_data.email}",
            ip_address=client_ip
        )
        db.add(audit)
        await db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
        )

    # Update last login timestamp
    user.last_login = datetime.utcnow()

    # Create audit record
    audit = AuditLog(
        user_id=user.id,
        action="LOGIN_SUCCESS",
        module="Authentication",
        entity_id=user.id,
        details=f"User {user.email} logged in successfully",
        ip_address=client_ip
    )
    db.add(audit)
    await db.commit()

    access_token = create_access_token(subject=user.id)
    return Token(access_token=access_token, token_type="bearer")

@router.post("/register", response_model=UserResponse, summary="Register New User")
async def register(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.email == user_in.email)
    result = await db.execute(stmt)
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    # Find role
    role_stmt = select(Role).where(Role.name == user_in.role_name)
    role_res = await db.execute(role_stmt)
    role = role_res.scalars().first()

    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role_id=role.id if role else None,
        is_active=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.get("/me", response_model=UserResponse, summary="Get Current Authenticated User")
async def get_me(current_user: User = Depends(get_current_user)):
    user_perms = []
    if current_user.role and current_user.role.permissions:
        user_perms = [p.name for p in current_user.role.permissions]
    
    # If Super Admin, include all permission badges
    if current_user.role and current_user.role.name == "SUPER_ADMIN":
        user_perms.append("*")

    response_dict = {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "is_active": current_user.is_active,
        "role": current_user.role,
        "avatar_url": current_user.avatar_url,
        "last_login": current_user.last_login,
        "permissions": user_perms
    }
    return response_dict

@router.post("/logout", summary="User Logout")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    audit = AuditLog(
        user_id=current_user.id,
        action="LOGOUT",
        module="Authentication",
        entity_id=current_user.id,
        details=f"User {current_user.email} logged out",
        ip_address=client_ip
    )
    db.add(audit)
    await db.commit()
    return {"message": "Logged out successfully"}
