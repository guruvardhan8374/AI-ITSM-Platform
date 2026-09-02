from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.domain_models import PriorityEnum, ProblemStatusEnum
from app.schemas.incident import IncidentResponse

class UserNestedSchema(BaseModel):
    id: str
    full_name: str
    email: str

    class Config:
        from_attributes = True

class TeamNestedSchema(BaseModel):
    id: str
    name: str

    class Config:
        from_attributes = True

class ProblemCreate(BaseModel):
    title: str
    description: str
    priority: Optional[PriorityEnum] = PriorityEnum.HIGH
    root_cause: Optional[str] = None
    symptoms: Optional[str] = None
    workaround: Optional[str] = None
    permanent_fix: Optional[str] = None
    known_error: bool = False
    affected_service: Optional[str] = "Database Services"
    assigned_team_id: Optional[str] = None

class ProblemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[PriorityEnum] = None
    status: Optional[ProblemStatusEnum] = None
    root_cause: Optional[str] = None
    symptoms: Optional[str] = None
    workaround: Optional[str] = None
    permanent_fix: Optional[str] = None
    known_error: Optional[bool] = None
    affected_service: Optional[str] = None
    assigned_team_id: Optional[str] = None
    assigned_agent_id: Optional[str] = None

class ProblemLinkIncident(BaseModel):
    incident_id: str

class ProblemHistoryResponse(BaseModel):
    id: str
    field_changed: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    timestamp: datetime
    changed_by: UserNestedSchema

    class Config:
        from_attributes = True

class ProblemResponse(BaseModel):
    id: str
    problem_number: str
    title: str
    description: str
    status: ProblemStatusEnum
    priority: PriorityEnum
    root_cause: Optional[str] = None
    symptoms: Optional[str] = None
    workaround: Optional[str] = None
    permanent_fix: Optional[str] = None
    known_error: bool
    affected_service: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

    created_by: UserNestedSchema
    assigned_team: Optional[TeamNestedSchema] = None
    assignee: Optional[UserNestedSchema] = None
    incidents: List[IncidentResponse] = []

    class Config:
        from_attributes = True

class PatternIncidentItem(BaseModel):
    incident_number: str
    title: str
    category: str
    created_at: str

class AIDetectProblemItem(BaseModel):
    pattern_title: str
    affected_service: str
    incident_count: int
    confidence: float
    recommended_problem_title: str
    recommended_root_cause: str
    matching_incidents: List[PatternIncidentItem]

class AIProblemAnalysisResponse(BaseModel):
    potential_root_cause: str
    confidence: float
    affected_components: List[str]
    related_incidents_count: int
    recommended_workaround: str
    recommended_permanent_fix: str
    risk: str
    recommended_next_action: str
