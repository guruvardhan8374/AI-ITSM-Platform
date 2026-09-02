from pydantic import BaseModel
from typing import Optional, List

class AIAnalysisRequest(BaseModel):
    title: str
    description: str
    category: Optional[str] = "General"
    impact: Optional[int] = 2
    urgency: Optional[int] = 2
    affected_service: Optional[str] = "Core Infrastructure"
    affected_asset_id: Optional[str] = None

class RootCauseItem(BaseModel):
    cause: str
    probability: float

class KnowledgeArticleItem(BaseModel):
    id: str
    title: str
    relevance: str

class SimilarIncidentItem(BaseModel):
    incident_number: str
    title: str
    resolution: str

class AIAnalysisResponse(BaseModel):
    recommended_priority: str
    confidence: float
    recommended_category: str
    recommended_team: str
    possible_root_causes: List[RootCauseItem]
    estimated_resolution_minutes: int
    troubleshooting_steps: List[str]
    similar_incidents: List[SimilarIncidentItem]
    recommended_articles: List[KnowledgeArticleItem]
    escalation_required: bool
