import { apiClient } from './api';

export interface SLAPolicyItem {
  id: string;
  name: string;
  priority: string;
  response_time_minutes: number;
  resolution_time_minutes: number;
  warning_threshold_percent: number;
  is_active: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface GlobalSearchResult {
  id: string;
  title: string;
  type: string;
  subtitle?: string;
  link: string;
}

export interface GlobalSearchResponse {
  query: string;
  total_results: number;
  results: GlobalSearchResult[];
}

export interface SettingsResponse {
  general: {
    platform_name: string;
    environment: string;
    timezone: string;
  };
  ai_config: {
    active_provider: string;
    status: string;
    available_providers: string[];
    model_version: string;
    confidence_threshold: number;
  };
  security: {
    jwt_expiration_minutes: number;
    mfa_enabled: boolean;
    password_min_length: number;
  };
}

export const governanceService = {
  // SLA
  listSLAPolicies: async () => {
    const res = await apiClient.get<SLAPolicyItem[]>('/governance/sla/policies');
    return res.data;
  },

  updateSLAPolicy: async (id: string, data: Partial<SLAPolicyItem>) => {
    const res = await apiClient.put<SLAPolicyItem>(`/governance/sla/policies/${id}`, data);
    return res.data;
  },

  // Notifications
  listNotifications: async (is_read?: boolean) => {
    const res = await apiClient.get<NotificationItem[]>('/governance/notifications', { params: { is_read } });
    return res.data;
  },

  markRead: async (id: string) => {
    const res = await apiClient.patch<NotificationItem>(`/governance/notifications/${id}/read`);
    return res.data;
  },

  markAllRead: async () => {
    const res = await apiClient.post<{ message: string; count: number }>('/governance/notifications/read-all');
    return res.data;
  },

  // Global Search
  search: async (query: string) => {
    const res = await apiClient.get<GlobalSearchResponse>('/governance/search', { params: { query } });
    return res.data;
  },

  // Settings & System Health
  getSettings: async () => {
    const res = await apiClient.get<SettingsResponse>('/governance/settings');
    return res.data;
  }
};
