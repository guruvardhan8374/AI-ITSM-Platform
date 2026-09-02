import { apiClient } from './api';

export interface IncidentVolumeReport {
  total_incidents: number;
  open_incidents: number;
  resolved_incidents: number;
  critical_incidents: number;
  priority_breakdown: { priority: string; count: number; percentage: number }[];
  category_breakdown: { category: string; count: number }[];
  status_breakdown: { status: string; count: number }[];
  volume_trend: { date: string; new_incidents: number; resolved_incidents: number }[];
}

export interface MTTRReport {
  overall_mttr_hours: number;
  overall_mttr_formatted: string;
  previous_period_mttr_hours: number;
  improvement_percentage: number;
  priority_breakdown: { priority: string; mttr_hours: number; mttr_formatted: string }[];
}

export interface SLAReport {
  compliance_percentage: number;
  within_sla_count: number;
  at_risk_count: number;
  breached_count: number;
  p1_compliance: number;
  p2_compliance: number;
  p3_compliance: number;
  p4_compliance: number;
}

export interface TeamPerformanceItem {
  team_id: string;
  team_name: string;
  open_incidents: number;
  resolved_incidents: number;
  avg_resolution_hours: number;
  sla_compliance_percentage: number;
  critical_incidents: number;
  performance_score: number;
}

export interface ChangeReport {
  total_changes: number;
  successful_changes: number;
  failed_changes: number;
  rolled_back_changes: number;
  pending_approval: number;
  success_rate_percentage: number;
  standard_success_rate: number;
  normal_success_rate: number;
  emergency_success_rate: number;
}

export interface AssetReport {
  total_assets: number;
  healthy: number;
  warning: number;
  critical: number;
  offline: number;
  in_maintenance: number;
  retired: number;
  by_type: Record<string, number>;
  by_criticality: Record<string, number>;
}

export interface InfraReport {
  overall_availability_percentage: number;
  total_alerts: number;
  critical_alerts: number;
  resolved_alerts: number;
  avg_response_time_ms: number;
}

export interface KBReport {
  total_articles: number;
  total_views: number;
  helpful_votes: number;
  not_helpful_votes: number;
}

export interface AIReport {
  incident_analyses_count: number;
  recommendations_generated: number;
  recommendations_accepted: number;
  recommendations_rejected: number;
  acceptance_rate_percentage: number;
  root_cause_suggestions: number;
  knowledge_recommendations: number;
  change_risk_assessments: number;
  anomaly_detections: number;
  predictive_maintenances: number;
}

export const reportService = {
  getIncidentsReport: async (params?: Record<string, any>) => {
    const res = await apiClient.get<IncidentVolumeReport>('/reports/incidents', { params });
    return res.data;
  },

  getMTTRReport: async (params?: Record<string, any>) => {
    const res = await apiClient.get<MTTRReport>('/reports/mttr', { params });
    return res.data;
  },

  getSLAReport: async (params?: Record<string, any>) => {
    const res = await apiClient.get<SLAReport>('/reports/sla', { params });
    return res.data;
  },

  getTeamsReport: async (params?: Record<string, any>) => {
    const res = await apiClient.get<TeamPerformanceItem[]>('/reports/teams', { params });
    return res.data;
  },

  getChangesReport: async (params?: Record<string, any>) => {
    const res = await apiClient.get<ChangeReport>('/reports/changes', { params });
    return res.data;
  },

  getAssetsReport: async (params?: Record<string, any>) => {
    const res = await apiClient.get<AssetReport>('/reports/assets', { params });
    return res.data;
  },

  getInfraReport: async (params?: Record<string, any>) => {
    const res = await apiClient.get<InfraReport>('/reports/infrastructure', { params });
    return res.data;
  },

  getKBReport: async (params?: Record<string, any>) => {
    const res = await apiClient.get<KBReport>('/reports/knowledge-base', { params });
    return res.data;
  },

  getAIReport: async (params?: Record<string, any>) => {
    const res = await apiClient.get<AIReport>('/reports/ai', { params });
    return res.data;
  }
};
