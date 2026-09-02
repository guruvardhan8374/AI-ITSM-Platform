import { apiClient } from './api';

export interface UserBasic {
  id: string;
  full_name: string;
  email: string;
}

export interface IncidentBasic {
  id: string;
  incident_number: string;
  title: string;
  priority: string;
  status: string;
}

export interface InfraMetricItem {
  id: string;
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
  network_mbps: number;
  response_time_ms: number;
  availability_percent: number;
  timestamp: string;
}

export interface InfraAlertItem {
  id: string;
  alert_number: string;
  resource_id: string;
  metric_name: string;
  current_value: number;
  threshold_value: number;
  severity: string;
  message: string;
  status: string;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  acknowledged_by?: UserBasic;
  incident?: IncidentBasic;
}

export interface InfraResource {
  id: string;
  resource_number: string;
  name: string;
  resource_type: string;
  ip_address?: string;
  environment: string;
  status: string;
  health: string;
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
  network_mbps: number;
  response_time_ms: number;
  availability_percent: number;
  last_check_at: string;
  created_at: string;
  alerts: InfraAlertItem[];
}

export interface AIAnomalyResponse {
  anomaly_detected: boolean;
  confidence: number;
  affected_resource: string;
  possible_cause: string;
  recommended_action: string;
  severity: string;
}

export interface AIPredictiveMaintenanceResponse {
  resource_id: string;
  resource_name: string;
  trend_description: string;
  metric_analyzed: string;
  current_value: number;
  predicted_threshold_breach_days: number;
  recommendation: string;
  action_required: boolean;
}

export const infrastructureService = {
  listResources: async (params?: { resource_type?: string; environment?: string; health?: string }) => {
    const res = await apiClient.get<InfraResource[]>('/infrastructure', { params });
    return res.data;
  },

  getResource: async (id: string) => {
    const res = await apiClient.get<InfraResource>(`/infrastructure/${id}`);
    return res.data;
  },

  getMetrics: async (id: string, limit?: number) => {
    const res = await apiClient.get<InfraMetricItem[]>(`/infrastructure/${id}/metrics`, { params: { limit } });
    return res.data;
  },

  triggerCheck: async (id: string, simulate_spike: boolean = false) => {
    const res = await apiClient.post<InfraResource>(`/infrastructure/${id}/check`, null, { params: { simulate_spike } });
    return res.data;
  },

  listAlerts: async (params?: { status?: string; severity?: string }) => {
    const res = await apiClient.get<InfraAlertItem[]>('/infrastructure/alerts/all', { params });
    return res.data;
  },

  acknowledgeAlert: async (id: string) => {
    const res = await apiClient.patch<InfraAlertItem>(`/infrastructure/alerts/${id}/acknowledge`);
    return res.data;
  },

  resolveAlert: async (id: string) => {
    const res = await apiClient.patch<InfraAlertItem>(`/infrastructure/alerts/${id}/resolve`);
    return res.data;
  },

  detectAnomaly: async (resource_id: string) => {
    const res = await apiClient.post<AIAnomalyResponse>('/ai/detect-anomaly', { resource_id });
    return res.data;
  },

  predictMaintenance: async (resource_id?: string) => {
    const res = await apiClient.post<AIPredictiveMaintenanceResponse>('/ai/predict-maintenance', null, { params: { resource_id } });
    return res.data;
  }
};
