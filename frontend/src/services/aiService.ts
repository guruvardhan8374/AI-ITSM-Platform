import { apiClient } from './api';

export interface RootCauseItem {
  cause: string;
  probability: number;
}

export interface KnowledgeArticleItem {
  id: string;
  title: string;
  relevance: string;
}

export interface SimilarIncidentItem {
  incident_number: string;
  title: string;
  resolution: string;
}

export interface AIAnalysisResponse {
  recommended_priority: string;
  confidence: number;
  recommended_category: string;
  recommended_team: string;
  possible_root_causes: RootCauseItem[];
  estimated_resolution_minutes: number;
  troubleshooting_steps: string[];
  similar_incidents: SimilarIncidentItem[];
  recommended_articles: KnowledgeArticleItem[];
  escalation_required: boolean;
}

export interface AIAnalysisPayload {
  title: string;
  description: string;
  category?: string;
  impact?: number;
  urgency?: number;
  affected_service?: string;
  affected_asset_id?: string;
}

export const aiService = {
  async analyzeIncident(payload: AIAnalysisPayload): Promise<AIAnalysisResponse> {
    const response = await apiClient.post<AIAnalysisResponse>('/ai/analyze-incident', payload);
    return response.data;
  }
};
