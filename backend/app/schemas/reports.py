from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class IncidentVolumeReportItem(BaseModel):
  date: str
  new_incidents: int
  resolved_incidents: int

class PriorityReportItem(BaseModel):
  priority: str
  count: int
  percentage: float

class CategoryReportItem(BaseModel):
  category: str
  count: int

class StatusReportItem(BaseModel):
  status: str
  count: int

class IncidentReportResponse(BaseModel):
  total_incidents: int
  open_incidents: int
  resolved_incidents: int
  critical_incidents: int
  priority_breakdown: List[PriorityReportItem]
  category_breakdown: List[CategoryReportItem]
  status_breakdown: List[StatusReportItem]
  volume_trend: List[IncidentVolumeReportItem]

class MTTRReportItem(BaseModel):
  priority: str
  mttr_hours: float
  mttr_formatted: str

class MTTRReportResponse(BaseModel):
  overall_mttr_hours: float
  overall_mttr_formatted: str
  previous_period_mttr_hours: float
  improvement_percentage: float
  priority_breakdown: List[MTTRReportItem]

class SLAReportResponse(BaseModel):
  compliance_percentage: float
  within_sla_count: int
  at_risk_count: int
  breached_count: int
  p1_compliance: float
  p2_compliance: float
  p3_compliance: float
  p4_compliance: float

class TeamPerformanceReportItem(BaseModel):
  team_id: str
  team_name: str
  open_incidents: int
  resolved_incidents: int
  avg_resolution_hours: float
  sla_compliance_percentage: float
  critical_incidents: int
  performance_score: float

class ChangeReportResponse(BaseModel):
  total_changes: int
  successful_changes: int
  failed_changes: int
  rolled_back_changes: int
  pending_approval: int
  success_rate_percentage: float
  standard_success_rate: float
  normal_success_rate: float
  emergency_success_rate: float

class AssetReportResponse(BaseModel):
  total_assets: int
  healthy: int
  warning: int
  critical: int
  offline: int
  in_maintenance: int
  retired: int
  by_type: Dict[str, int]
  by_criticality: Dict[str, int]

class InfraReportResponse(BaseModel):
  overall_availability_percentage: float
  total_alerts: int
  critical_alerts: int
  resolved_alerts: int
  avg_response_time_ms: float
  resource_availability: List[Dict[str, Any]]

class KBReportResponse(BaseModel):
  total_articles: int
  total_views: int
  helpful_votes: int
  top_viewed_articles: List[Dict[str, Any]]
  top_categories: List[Dict[str, Any]]

class AIReportResponse(BaseModel):
  incident_analyses_count: int
  recommendations_generated: int
  recommendations_accepted: int
  recommendations_rejected: int
  acceptance_rate_percentage: float
  root_cause_suggestions: int
  knowledge_recommendations: int
  change_risk_assessments: int
  anomaly_detections: int
  predictive_maintenances: int
