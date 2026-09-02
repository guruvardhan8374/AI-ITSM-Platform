import { apiClient } from './api';

export interface UserSummary {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

export interface TeamSummary {
  id: string;
  name: string;
}

export interface AssetSummary {
  id: string;
  name: string;
  asset_tag: string;
}

export interface Incident {
  id: string;
  incident_number: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  priority: 'P1_Critical' | 'P2_High' | 'P3_Medium' | 'P4_Low';
  impact: number;
  urgency: number;
  status: 'New' | 'Assigned' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed' | 'Reopened';
  source: string;
  affected_service?: string;
  sla_due_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;

  reporter: UserSummary;
  assignee?: UserSummary;
  assigned_team?: TeamSummary;
  affected_asset?: AssetSummary;
}

export interface IncidentComment {
  id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  author: UserSummary;
}

export interface IncidentHistoryItem {
  id: string;
  field_changed: string;
  old_value?: string;
  new_value?: string;
  timestamp: string;
  changed_by: UserSummary;
}

export interface CreateIncidentPayload {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  impact: number;
  urgency: number;
  priority?: string;
  affected_service?: string;
  affected_asset_id?: string;
  assigned_team_id?: string;
}

export const incidentService = {
  async listIncidents(params?: {
    search?: string;
    priority?: string;
    status?: string;
    category?: string;
    team_id?: string;
    page?: number;
    page_size?: number;
  }): Promise<Incident[]> {
    const response = await apiClient.get<Incident[]>('/incidents', { params });
    return response.data;
  },

  async getIncident(id: string): Promise<Incident> {
    const response = await apiClient.get<Incident>(`/incidents/${id}`);
    return response.data;
  },

  async createIncident(data: CreateIncidentPayload): Promise<Incident> {
    const response = await apiClient.post<Incident>('/incidents', data);
    return response.data;
  },

  async updateStatus(id: string, status: string, resolution_notes?: string): Promise<Incident> {
    const response = await apiClient.patch<Incident>(`/incidents/${id}/status`, { status, resolution_notes });
    return response.data;
  },

  async assignIncident(id: string, assigned_team_id?: string, assigned_agent_id?: string): Promise<Incident> {
    const response = await apiClient.patch<Incident>(`/incidents/${id}/assign`, { assigned_team_id, assigned_agent_id });
    return response.data;
  },

  async updatePriority(id: string, priority: string, impact?: number, urgency?: number): Promise<Incident> {
    const response = await apiClient.patch<Incident>(`/incidents/${id}/priority`, { priority, impact, urgency });
    return response.data;
  },

  async addComment(id: string, content: string, is_internal: boolean = false): Promise<IncidentComment> {
    const response = await apiClient.post<IncidentComment>(`/incidents/${id}/comments`, { content, is_internal });
    return response.data;
  },

  async getComments(id: string): Promise<IncidentComment[]> {
    const response = await apiClient.get<IncidentComment[]>(`/incidents/${id}/comments`);
    return response.data;
  },

  async getHistory(id: string): Promise<IncidentHistoryItem[]> {
    const response = await apiClient.get<IncidentHistoryItem[]>(`/incidents/${id}/history`);
    return response.data;
  }
};
