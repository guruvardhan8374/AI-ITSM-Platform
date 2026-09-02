from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserBasic(BaseModel):
    id: str
    full_name: str
    email: str

    class Config:
        from_attributes = True

class IncidentBasic(BaseModel):
    id: str
    incident_number: str
    title: str
    priority: str
    status: str

    class Config:
        from_attributes = True

class ChangeBasic(BaseModel):
    id: str
    change_number: str
    title: str
    status: str
    risk_level: str

    class Config:
        from_attributes = True

class AssetCreateRequest(BaseModel):
    asset_name: str
    asset_type: str # Laptop, Server, Database, Router, Switch, Firewall, Virtual Machine, Cloud Resource, etc.
    serial_number: Optional[str] = None
    hostname: Optional[str] = None
    ip_address: Optional[str] = None
    owner_id: Optional[str] = None
    department_id: Optional[str] = None
    business_unit_id: Optional[str] = None
    team_id: Optional[str] = None
    location: Optional[str] = "Primary Datacenter - Rack A4"
    status: str = "ACTIVE"
    health: str = "HEALTHY"
    criticality: str = "MEDIUM"
    manufacturer: Optional[str] = "Dell Enterprise"
    model: Optional[str] = "PowerEdge R750"
    purchase_date: Optional[datetime] = None
    warranty_expiry: Optional[datetime] = None
    description: Optional[str] = None

class AssetUpdateRequest(BaseModel):
    asset_name: Optional[str] = None
    asset_type: Optional[str] = None
    serial_number: Optional[str] = None
    hostname: Optional[str] = None
    ip_address: Optional[str] = None
    owner_id: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    health: Optional[str] = None
    criticality: Optional[str] = None
    description: Optional[str] = None

class AssetMaintenanceCreateRequest(BaseModel):
    type: str # Database optimization, Security patch, Hardware replacement, Firmware upgrade
    description: str
    result: str = "SUCCESS"
    next_maintenance_date: Optional[datetime] = None

class AssetMaintenanceResponse(BaseModel):
    id: str
    maintenance_number: str
    type: str
    description: str
    maintenance_date: datetime
    result: str
    next_maintenance_date: Optional[datetime] = None
    performed_by: Optional[UserBasic] = None

    class Config:
        from_attributes = True

class AssetHistoryResponse(BaseModel):
    id: str
    field_changed: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    timestamp: datetime
    changed_by: Optional[UserBasic] = None

    class Config:
        from_attributes = True

class AssetResponse(BaseModel):
    id: str
    asset_number: str
    asset_name: str
    asset_type: str
    serial_number: Optional[str] = None
    hostname: Optional[str] = None
    ip_address: Optional[str] = None
    location: Optional[str] = None
    status: str
    health: str
    criticality: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    purchase_date: Optional[datetime] = None
    warranty_expiry: Optional[datetime] = None
    last_maintenance: Optional[datetime] = None
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    owner: Optional[UserBasic] = None
    incidents: List[IncidentBasic] = []
    changes: List[ChangeBasic] = []
    maintenances: List[AssetMaintenanceResponse] = []
    history: List[AssetHistoryResponse] = []

    class Config:
        from_attributes = True
