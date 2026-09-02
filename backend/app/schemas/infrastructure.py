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

class InfraResourceCreateRequest(BaseModel):
    name: str
    resource_type: str # Server, Database, Router, Switch, Firewall, API Gateway, Virtual Machine, Cloud Resource
    ip_address: Optional[str] = None
    environment: str = "Production" # Production, Staging, Development
    status: str = "ACTIVE"
    health: str = "HEALTHY"
    cpu_percent: float = 45.0
    memory_percent: float = 60.0
    disk_percent: float = 55.0
    network_mbps: float = 120.0
    response_time_ms: float = 15.0
    availability_percent: float = 99.98

class InfraMetricResponse(BaseModel):
    id: str
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    network_mbps: float
    response_time_ms: float
    availability_percent: float
    timestamp: datetime

    class Config:
        from_attributes = True

class InfraAlertResponse(BaseModel):
    id: str
    alert_number: str
    resource_id: str
    metric_name: str
    current_value: float
    threshold_value: float
    severity: str
    message: str
    status: str
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    acknowledged_by: Optional[UserBasic] = None
    incident_id: Optional[str] = None
    incident: Optional[IncidentBasic] = None


    class Config:
        from_attributes = True

class InfraResourceResponse(BaseModel):
    id: str
    resource_number: str
    name: str
    resource_type: str
    ip_address: Optional[str] = None
    environment: str
    status: str
    health: str
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    network_mbps: float
    response_time_ms: float
    availability_percent: float
    last_check_at: datetime
    created_at: datetime

    alerts: List[InfraAlertResponse] = []

    class Config:
        from_attributes = True

class AIAnomalyDetectionRequest(BaseModel):
    resource_id: str

class AIAnomalyDetectionResponse(BaseModel):
    anomaly_detected: bool
    confidence: float
    affected_resource: str
    possible_cause: str
    recommended_action: str
    severity: str

class AIPredictiveMaintenanceResponse(BaseModel):
    resource_id: str
    resource_name: str
    trend_description: str
    metric_analyzed: str
    current_value: float
    predicted_threshold_breach_days: int
    recommendation: str
    action_required: bool
