import { apiClient } from './api';

export interface UserBasic {
  id: string;
  full_name: string;
  email: string;
}

export interface TeamBasic {
  id: string;
  name: string;
}

export interface AssetBasic {
  id: string;
  asset_number: string;
  asset_name: string;
  asset_type: string;
}

export interface IncidentBasic {
  id: string;
  incident_number: string;
  title: string;
  priority: string;
  status: string;
}

export interface ChangeHistoryItem {
  id: string;
  field_changed: string;
  old_value?: string;
  new_value?: string;
  timestamp: string;
  changed_by: UserBasic;
}

export interface ChangeRequest {
  id: string;
  change_number: string;
  title: string;
  description: string;
  reason: string;
  change_type: string;
  risk_level: string;
  impact: number;
  urgency: number;
  affected_services?: string;
  
  implementation_plan: string;
  rollback_plan: string;
  validation_plan?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  
  approval_status: string;
  approval_decision_at?: string;
  approval_comments?: string;
  status: string;
  
  created_at: string;
  updated_at: string;
  completed_at?: string;

  requester: UserBasic;
  assigned_team?: TeamBasic;
  engineer?: UserBasic;
  approver?: UserBasic;
  incidents: IncidentBasic[];
  affected_assets_list: AssetBasic[];
  history: ChangeHistoryItem[];
}

export interface CreateChangeInput {
  title: string;
  description: string;
  reason: string;
  change_type: string;
  impact: number;
  urgency: number;
  affected_services?: string;
  implementation_plan: string;
  rollback_plan: string;
  validation_plan?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  affected_asset_ids?: string[];
  related_incident_ids?: string[];
}

export interface AIChangeAnalysisResponse {
  recommended_risk: string;
  confidence: number;
  potential_risks: string[];
  affected_components: string[];
  recommended_approval_level: string;
  recommended_implementation_window: string;
  rollback_recommendation: string;
  validation_recommendation: string;
}

export const changeService = {
  listChanges: async (params?: { search?: string; status?: string; change_type?: string; risk_level?: string; page?: number }) => {
    const res = await apiClient.get<ChangeRequest[]>('/changes', { params });
    return res.data;
  },

  getChange: async (id: string) => {
    const res = await apiClient.get<ChangeRequest>(`/changes/${id}`);
    return res.data;
  },

  createChange: async (data: CreateChangeInput) => {
    const res = await apiClient.post<ChangeRequest>('/changes', data);
    return res.data;
  },

  updateStatus: async (id: string, newStatus: string) => {
    const res = await apiClient.patch<ChangeRequest>(`/changes/${id}/status`, null, {
      params: { new_status: newStatus }
    });
    return res.data;
  },

  approveChange: async (id: string, comments?: string) => {
    const res = await apiClient.post<ChangeRequest>(`/changes/${id}/approve`, { comments });
    return res.data;
  },

  rejectChange: async (id: string, comments?: string) => {
    const res = await apiClient.post<ChangeRequest>(`/changes/${id}/reject`, { comments });
    return res.data;
  },

  rollbackChange: async (id: string, comments?: string) => {
    const res = await apiClient.post<ChangeRequest>(`/changes/${id}/rollback`, { comments });
    return res.data;
  },

  analyzeChangeRisk: async (data: { change_description: string; change_type: string; impact: number; urgency: number; affected_services?: string }) => {
    const res = await apiClient.post<AIChangeAnalysisResponse>('/ai/analyze-change', data);
    return res.data;
  },

  getHistory: async (id: string) => {
    const res = await apiClient.get<ChangeHistoryItem[]>(`/changes/${id}/history`);
    return res.data;
  }
};
