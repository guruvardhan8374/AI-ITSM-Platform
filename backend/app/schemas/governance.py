from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class SLAPolicySchema(BaseModel):
  id: str
  name: str
  priority: str
  response_time_minutes: int
  resolution_time_minutes: int
  warning_threshold_percent: int = 80
  is_active: bool = True

  class Config:
    from_attributes = True

class SLAPolicyUpdate(BaseModel):
  name: Optional[str] = None
  response_time_minutes: Optional[int] = None
  resolution_time_minutes: Optional[int] = None
  warning_threshold_percent: Optional[int] = None
  is_active: Optional[bool] = None

class NotificationSchema(BaseModel):
  id: str
  title: str
  message: str
  category: str
  priority: str
  is_read: bool
  link: Optional[str] = None
  created_at: datetime

  class Config:
    from_attributes = True

class GlobalSearchResultItem(BaseModel):
  id: str
  title: str
  type: str # Incident, ServiceRequest, Problem, Change, Asset, Infra, KB, User
  subtitle: Optional[str] = None
  link: str

class GlobalSearchResponse(BaseModel):
  query: str
  total_results: int
  results: List[GlobalSearchResultItem]

class SystemHealthResponse(BaseModel):
  frontend_status: str = "Healthy"
  backend_status: str = "Healthy"
  database_status: str = "Healthy"
  ai_engine_status: str = "Healthy"
  system_uptime_seconds: float = 86400.0
