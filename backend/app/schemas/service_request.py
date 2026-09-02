from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.domain_models import PriorityEnum, RequestStatusEnum

class UserNestedSchema(BaseModel):
    id: str
    full_name: str
    email: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class TeamNestedSchema(BaseModel):
    id: str
    name: str

    class Config:
        from_attributes = True

class ServiceCatalogResponse(BaseModel):
    id: str
    name: str
    category: str
    description: str
    fulfillment_time_hours: int
    approval_required: bool
    assigned_team_name: str
    icon: str
    status: str

    class Config:
        from_attributes = True

class ServiceRequestCreate(BaseModel):
    service_id: Optional[str] = None
    title: str
    description: str
    priority: Optional[PriorityEnum] = PriorityEnum.MEDIUM
    additional_info: Optional[str] = None
    assigned_team_id: Optional[str] = None

class ServiceRequestApproval(BaseModel):
    comments: Optional[str] = None

class ServiceRequestStatusUpdate(BaseModel):
    status: RequestStatusEnum

class ServiceRequestHistoryResponse(BaseModel):
    id: str
    field_changed: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    timestamp: datetime
    changed_by: UserNestedSchema

    class Config:
        from_attributes = True

class ServiceRequestResponse(BaseModel):
    id: str
    request_number: str
    title: str
    description: str
    priority: PriorityEnum
    status: RequestStatusEnum
    approval_status: str
    approval_comments: Optional[str] = None
    approval_decision_at: Optional[datetime] = None
    additional_info: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    service: Optional[ServiceCatalogResponse] = None
    requester: UserNestedSchema
    approver: Optional[UserNestedSchema] = None
    assigned_team: Optional[TeamNestedSchema] = None
    assignee: Optional[UserNestedSchema] = None

    class Config:
        from_attributes = True
