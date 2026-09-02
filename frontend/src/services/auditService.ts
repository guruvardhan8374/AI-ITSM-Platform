import { apiClient } from './api';

export interface AuditUser {
  id: string;
  full_name: string;
  email: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  module: string;
  entity_id?: string;
  details?: string;
  ip_address?: string;
  timestamp: string;
  user?: AuditUser;
}

export const auditService = {
  listLogs: async (params?: { module?: string; action?: string; search?: string; page?: number }) => {
    const res = await apiClient.get<AuditLogItem[]>('/audit-logs', { params });
    return res.data;
  },

  getLog: async (id: string) => {
    const res = await apiClient.get<AuditLogItem>(`/audit-logs/${id}`);
    return res.data;
  }
};
