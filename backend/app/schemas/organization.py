from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PermissionSchema(BaseModel):
  id: str
  name: str
  module: str

  class Config:
    from_attributes = True

class RoleSchema(BaseModel):
  id: str
  name: str
  description: Optional[str] = None
  permissions: List[PermissionSchema] = []

  class Config:
    from_attributes = True

class RoleCreate(BaseModel):
  name: str
  description: Optional[str] = None
  permission_ids: List[str] = []

class RoleUpdate(BaseModel):
  name: Optional[str] = None
  description: Optional[str] = None
  permission_ids: Optional[List[str]] = None

class DepartmentBasic(BaseModel):
  id: str
  name: str

  class Config:
    from_attributes = True

class BusinessUnitBasic(BaseModel):
  id: str
  name: str

  class Config:
    from_attributes = True

class UserSchema(BaseModel):
  id: str
  email: str
  full_name: str
  is_active: bool
  role: Optional[RoleSchema] = None
  department: Optional[DepartmentBasic] = None
  business_unit: Optional[BusinessUnitBasic] = None
  created_at: datetime
  last_login: Optional[datetime] = None

  class Config:
    from_attributes = True

class UserCreate(BaseModel):
  email: str
  full_name: str
  password: str
  role_id: str
  department_id: Optional[str] = None
  business_unit_id: Optional[str] = None

class UserUpdate(BaseModel):
  email: Optional[str] = None
  full_name: Optional[str] = None
  password: Optional[str] = None
  role_id: Optional[str] = None
  department_id: Optional[str] = None
  business_unit_id: Optional[str] = None

class BusinessUnitSchema(BaseModel):
  id: str
  name: str
  description: Optional[str] = None
  departments_count: int = 0
  users_count: int = 0

  class Config:
    from_attributes = True

class BusinessUnitCreate(BaseModel):
  name: str
  description: Optional[str] = None

class DepartmentSchema(BaseModel):
  id: str
  name: str
  business_unit_id: Optional[str] = None
  business_unit_name: Optional[str] = None
  teams_count: int = 0
  users_count: int = 0

  class Config:
    from_attributes = True

class DepartmentCreate(BaseModel):
  name: str
  business_unit_id: Optional[str] = None

class TeamSchema(BaseModel):
  id: str
  name: str
  description: Optional[str] = None
  department_id: Optional[str] = None
  department_name: Optional[str] = None
  lead_name: Optional[str] = None
  members_count: int = 0
  open_incidents_count: int = 0

  class Config:
    from_attributes = True

class TeamCreate(BaseModel):
  name: str
  description: Optional[str] = None
  department_id: Optional[str] = None
