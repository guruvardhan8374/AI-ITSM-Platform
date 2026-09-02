from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role_name: Optional[str] = "End User"
    department_name: Optional[str] = None

class PermissionResponse(BaseModel):
    id: str
    name: str
    module: str

    class Config:
        from_attributes = True

class RoleResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    permissions: List[PermissionResponse] = []

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    is_active: bool
    role: Optional[RoleResponse] = None
    avatar_url: Optional[str] = None
    last_login: Optional[datetime] = None
    permissions: List[str] = []

    class Config:
        from_attributes = True
