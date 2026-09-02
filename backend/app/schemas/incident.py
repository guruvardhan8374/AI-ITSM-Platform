from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.domain_models import PriorityEnum, StatusEnum

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

class AssetNestedSchema(BaseModel):
    id: str
    name: str
    asset_tag: str

    class Config:
        from_attributes = True

class IncidentCommentCreate(BaseModel):
    content: str
    is_internal: bool = False

class IncidentCommentResponse(BaseModel):
    id: str
    content: str
    is_internal: bool
    created_at: datetime
    author: UserNestedSchema

    class Config:
        from_attributes = True

class IncidentHistoryResponse(BaseModel):
    id: str
    field_changed: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    timestamp: datetime
    changed_by: UserNestedSchema

    class Config:
        from_attributes = True

class IncidentCreate(BaseModel):
    title: str
    description: str
    category: str
    subcategory: Optional[str] = None
    impact: int = 2
    urgency: int = 2
    priority: Optional[PriorityEnum] = None
    affected_service: Optional[str] = "Core Infrastructure"
    affected_asset_id: Optional[str] = None
    assigned_team_id: Optional[str] = None

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    impact: Optional[int] = None
    urgency: Optional[int] = None
    priority: Optional[PriorityEnum] = None
    status: Optional[StatusEnum] = None
    resolution_notes: Optional[str] = None
    assigned_team_id: Optional[str] = None
    assigned_agent_id: Optional[str] = None

class IncidentStatusUpdate(BaseModel):
    status: StatusEnum
    resolution_notes: Optional[str] = None

class IncidentAssignUpdate(BaseModel):
    assigned_team_id: Optional[str] = None
    assigned_agent_id: Optional[str] = None

class IncidentPriorityUpdate(BaseModel):
    priority: PriorityEnum
    impact: Optional[int] = None
    urgency: Optional[int] = None

class IncidentResponse(BaseModel):
    id: str
    incident_number: str
    title: str
    description: str
    category: str
    subcategory: Optional[str] = None
    priority: PriorityEnum
    impact: int
    urgency: int
    status: StatusEnum
    source: str
    affected_service: Optional[str] = None
    sla_due_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    reporter: UserNestedSchema
    assignee: Optional[UserNestedSchema] = None
    assigned_team: Optional[TeamNestedSchema] = None
    affected_asset: Optional[AssetNestedSchema] = None

    class Config:
        from_attributes = True

class AIIncidentAnalysisRequest(BaseModel):
    title: str
    description: str
    category: Optional[str] = "General"

class AIIncidentAnalysisResponse(BaseModel):
    summary: str
    probable_root_cause: str
    recommended_steps: List[str]
    confidence: float
    suggested_priority: str
    similar_incidents_count: int
    kb_articles_count: int
    recommended_priority: Optional[str] = None
    confidence_score: Optional[float] = None
    recommended_category: Optional[str] = None
    recommended_team: Optional[str] = None
    estimated_resolution_hours: Optional[float] = None
    root_cause_candidates: Optional[List[str]] = None
    suggested_workaround: Optional[str] = None
    kb_article_recommendations: Optional[List[str]] = None

