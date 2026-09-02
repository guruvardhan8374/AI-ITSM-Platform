from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserBasic(BaseModel):
    id: str
    full_name: str
    email: str

    class Config:
        from_attributes = True

class TeamBasic(BaseModel):
    id: str
    name: str

    class Config:
        from_attributes = True

class AssetBasic(BaseModel):
    id: str
    asset_number: str
    asset_name: str
    asset_type: str

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

class ChangeCreateRequest(BaseModel):
    title: str
    description: str
    reason: str
    change_type: str = "NORMAL" # STANDARD, NORMAL, EMERGENCY
    impact: int = 2
    urgency: int = 2
    affected_services: Optional[str] = "Core Infrastructure"
    implementation_plan: str
    rollback_plan: str
    validation_plan: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    assigned_team_id: Optional[str] = None
    assigned_engineer_id: Optional[str] = None
    affected_asset_ids: List[str] = []
    related_incident_ids: List[str] = []

class ChangeUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    reason: Optional[str] = None
    change_type: Optional[str] = None
    risk_level: Optional[str] = None
    impact: Optional[int] = None
    urgency: Optional[int] = None
    affected_services: Optional[str] = None
    implementation_plan: Optional[str] = None
    rollback_plan: Optional[str] = None
    validation_plan: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    status: Optional[str] = None

class ChangeApprovalRequest(BaseModel):
    comments: Optional[str] = None

class ChangeHistoryResponse(BaseModel):
    id: str
    field_changed: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    timestamp: datetime
    changed_by: UserBasic

    class Config:
        from_attributes = True

class ChangeResponse(BaseModel):
    id: str
    change_number: str
    title: str
    description: str
    reason: str
    change_type: str
    risk_level: str
    impact: int
    urgency: int
    affected_services: Optional[str] = None
    
    implementation_plan: str
    rollback_plan: str
    validation_plan: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    
    approval_status: str
    approval_decision_at: Optional[datetime] = None
    approval_comments: Optional[str] = None
    status: str
    
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    requester: UserBasic
    assigned_team: Optional[TeamBasic] = None
    engineer: Optional[UserBasic] = None
    approver: Optional[UserBasic] = None
    incidents: List[IncidentBasic] = []
    affected_assets_list: List[AssetBasic] = []
    history: List[ChangeHistoryResponse] = []

    class Config:
        from_attributes = True

class AIChangeAnalysisRequest(BaseModel):
    change_description: str
    change_type: str
    impact: int = 2
    urgency: int = 2
    affected_services: Optional[str] = None
    affected_assets: Optional[str] = None

class AIChangeAnalysisResponse(BaseModel):
    recommended_risk: str # LOW, MEDIUM, HIGH, CRITICAL
    confidence: float
    potential_risks: List[str]
    affected_components: List[str]
    recommended_approval_level: str
    recommended_implementation_window: str
    rollback_recommendation: str
    validation_recommendation: str
