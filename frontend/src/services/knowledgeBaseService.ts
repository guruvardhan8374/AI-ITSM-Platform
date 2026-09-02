import { apiClient } from './api';

export interface KnowledgeArticle {
  id: string;
  article_number: string;
  title: string;
  category: string;
  problem?: string;
  symptoms?: string;
  root_cause?: string;
  resolution: string;
  workaround?: string;
  content: string;
  tags?: string;
  status: string;
  views: number;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string;

  author: { id: string; full_name: string; email: string };
}

export interface AIKnowledgeRecommendItem {
  id: string;
  article_number: string;
  title: string;
  category: string;
  relevance: number;
  reason: string;
}

export const knowledgeBaseService = {
  async listArticles(params?: { search?: string; category?: string; status?: string }): Promise<KnowledgeArticle[]> {
    const response = await apiClient.get<KnowledgeArticle[]>('/knowledge-base', { params });
    return response.data;
  },

  async getArticle(id: string): Promise<KnowledgeArticle> {
    const response = await apiClient.get<KnowledgeArticle>(`/knowledge-base/${id}`);
    return response.data;
  },

  async createArticle(data: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> {
    const response = await apiClient.post<KnowledgeArticle>('/knowledge-base', data);
    return response.data;
  },

  async voteHelpful(id: string): Promise<KnowledgeArticle> {
    const response = await apiClient.post<KnowledgeArticle>(`/knowledge-base/${id}/helpful`);
    return response.data;
  },

  async voteNotHelpful(id: string): Promise<KnowledgeArticle> {
    const response = await apiClient.post<KnowledgeArticle>(`/knowledge-base/${id}/not-helpful`);
    return response.data;
  },

  async recommendKnowledge(payload: { title: string; description: string; category?: string }): Promise<AIKnowledgeRecommendItem[]> {
    const response = await apiClient.post<{ recommended_articles: AIKnowledgeRecommendItem[] }>('/ai/recommend-knowledge', payload);
    return response.data.recommended_articles;
  }
};
