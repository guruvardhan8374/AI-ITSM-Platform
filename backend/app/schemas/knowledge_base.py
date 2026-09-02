from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserNestedSchema(BaseModel):
    id: str
    full_name: str
    email: str

    class Config:
        from_attributes = True

class KnowledgeArticleCreate(BaseModel):
    title: str
    category: str
    problem: Optional[str] = None
    symptoms: Optional[str] = None
    root_cause: Optional[str] = None
    resolution: str
    workaround: Optional[str] = None
    content: str
    tags: Optional[str] = None
    status: Optional[str] = "Published"

class KnowledgeArticleUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    problem: Optional[str] = None
    symptoms: Optional[str] = None
    root_cause: Optional[str] = None
    resolution: Optional[str] = None
    workaround: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[str] = None
    status: Optional[str] = None

class KnowledgeArticleResponse(BaseModel):
    id: str
    article_number: str
    title: str
    category: str
    problem: Optional[str] = None
    symptoms: Optional[str] = None
    root_cause: Optional[str] = None
    resolution: str
    workaround: Optional[str] = None
    content: str
    tags: Optional[str] = None
    status: str
    views: int
    helpful_count: int
    not_helpful_count: int
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None

    author: UserNestedSchema

    class Config:
        from_attributes = True

class AIRecommendKnowledgeRequest(BaseModel):
    title: str
    description: str
    category: Optional[str] = None

class AIKnowledgeRecommendItem(BaseModel):
    id: str
    article_number: str
    title: str
    category: str
    relevance: float
    reason: str

class AIKnowledgeRecommendResponse(BaseModel):
    recommended_articles: List[AIKnowledgeRecommendItem]

AIKnowledgeRecommendRequest = AIRecommendKnowledgeRequest

