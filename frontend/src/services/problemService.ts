import { apiClient } from './api';
import { Incident } from './incidentService';

export interface Problem {
  id: string;
  problem_number: string;
  title: string;
  description: string;
  status: 'OPEN' | 'INVESTIGATION' | 'ROOT_CAUSE_IDENTIFIED' | 'KNOWN_ERROR' | 'FIX_IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'P1_Critical' | 'P2_High' | 'P3_Medium' | 'P4_Low';
  root_cause?: string;
  symptoms?: string;
  workaround?: string;
  permanent_fix?: string;
  known_error: boolean;
  affected_service?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;

  created_by: { id: string; full_name: string; email: string };
  assigned_team?: { id: string; name: string };
  assignee?: { id: string; full_name: string; email: string };
  incidents: Incident[];
}

export interface ProblemHistoryItem {
  id: string;
  field_changed: string;
  old_value?: string;
  new_value?: string;
  timestamp: string;
  changed_by: { id: string; full_name: string; email: string };
}

export interface AIDetectProblemItem {
  pattern_title: string;
  affected_service: string;
  incident_count: number;
  confidence: number;
  recommended_problem_title: string;
  recommended_root_cause: string;
  matching_incidents: Array<{ incident_number: string; title: string; category: string; created_at: string }>;
}

export interface AIProblemAnalysisResponse {
  potential_root_cause: string;
  confidence: number;
  affected_components: string[];
  related_incidents_count: number;
  recommended_workaround: string;
  recommended_permanent_fix: string;
  risk: string;
  recommended_next_action: string;
}

export const problemService = {
  async listProblems(params?: { search?: string; status?: string; priority?: string; page?: number }): Promise<Problem[]> {
    const response = await apiClient.get<Problem[]>('/problems', { params });
    return response.data;
  },

  async getProblem(id: string): Promise<Problem> {
    const response = await apiClient.get<Problem>(`/problems/${id}`);
    return response.data;
  },

  async createProblem(data: Partial<Problem>): Promise<Problem> {
    const response = await apiClient.post<Problem>('/problems', data);
    return response.data;
  },

  async updateProblem(id: string, data: Partial<Problem>): Promise<Problem> {
    const response = await apiClient.put<Problem>(`/problems/${id}`, data);
    return response.data;
  },

  async linkIncident(id: string, incident_id: string): Promise<Problem> {
    const response = await apiClient.post<Problem>(`/problems/${id}/incidents`, { incident_id });
    return response.data;
  },

  async unlinkIncident(id: string, incident_id: string): Promise<Problem> {
    const response = await apiClient.delete<Problem>(`/problems/${id}/incidents/${incident_id}`);
    return response.data;
  },

  async getHistory(id: string): Promise<ProblemHistoryItem[]> {
    const response = await apiClient.get<ProblemHistoryItem[]>(`/problems/${id}/history`);
    return response.data;
  },

  async detectProblems(): Promise<AIDetectProblemItem[]> {
    const response = await apiClient.post<AIDetectProblemItem[]>('/ai/detect-problems');
    return response.data;
  },

  async analyzeProblem(): Promise<AIProblemAnalysisResponse> {
    const response = await apiClient.post<AIProblemAnalysisResponse>('/ai/analyze-problem');
    return response.data;
  }
};
