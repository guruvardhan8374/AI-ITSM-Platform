from pydantic import BaseModel
from typing import List

class DashboardSummaryResponse(BaseModel):
    total_incidents: int
    open_incidents: int
    critical_incidents: int
    resolved_today: int
    sla_breaches: int
    service_availability: float
    
    # Prompt 4 Module KPIs
    open_service_requests: int = 12
    pending_approvals: int = 4
    open_problems: int = 3
    known_errors: int = 2
    knowledge_articles_count: int = 15

class IncidentTrendItem(BaseModel):
    day: str
    incidents: int
    resolved: int

class PriorityDistItem(BaseModel):
    priority: str
    count: int
    color: str

class CategoryDistItem(BaseModel):
    category: str
    count: int

class SLASummaryResponse(BaseModel):
    within_sla: int
    at_risk: int
    breached: int
    compliance_rate: float

class InfraMetricItem(BaseModel):
    name: str
    cpu_usage: float
    memory_usage: float
    status: str
