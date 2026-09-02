import { apiClient } from './api';

export interface ServiceCatalogItem {
  id: string;
  name: string;
  category: string;
  description: string;
  fulfillment_time_hours: number;
  approval_required: boolean;
  assigned_team_name: string;
  icon: string;
  status: string;
}

export interface ServiceRequest {
  id: string;
  request_number: string;
  title: string;
  description: string;
  priority: 'P1_Critical' | 'P2_High' | 'P3_Medium' | 'P4_Low';
  status: 'REQUESTED' | 'APPROVAL_REQUIRED' | 'APPROVED' | 'FULFILLMENT' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUIRED';
  approval_comments?: string;
  approval_decision_at?: string;
  additional_info?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;

  service?: ServiceCatalogItem;
  requester: { id: string; full_name: string; email: string };
  approver?: { id: string; full_name: string; email: string };
  assigned_team?: { id: string; name: string };
  assignee?: { id: string; full_name: string; email: string };
}

export interface ServiceRequestHistoryItem {
  id: string;
  field_changed: string;
  old_value?: string;
  new_value?: string;
  timestamp: string;
  changed_by: { id: string; full_name: string; email: string };
}

export interface CreateRequestPayload {
  service_id?: string;
  title: string;
  description: string;
  priority?: string;
  additional_info?: string;
  assigned_team_id?: string;
}

export const serviceRequestService = {
  async getCatalog(): Promise<ServiceCatalogItem[]> {
    const response = await apiClient.get<ServiceCatalogItem[]>('/service-requests/catalog');
    return response.data;
  },

  async listRequests(params?: { search?: string; status?: string; page?: number; page_size?: number }): Promise<ServiceRequest[]> {
    const response = await apiClient.get<ServiceRequest[]>('/service-requests', { params });
    return response.data;
  },

  async getRequest(id: string): Promise<ServiceRequest> {
    const response = await apiClient.get<ServiceRequest>(`/service-requests/${id}`);
    return response.data;
  },

  async createRequest(data: CreateRequestPayload): Promise<ServiceRequest> {
    const response = await apiClient.post<ServiceRequest>('/service-requests', data);
    return response.data;
  },

  async approveRequest(id: string, comments?: string): Promise<ServiceRequest> {
    const response = await apiClient.post<ServiceRequest>(`/service-requests/${id}/approve`, { comments });
    return response.data;
  },

  async rejectRequest(id: string, comments?: string): Promise<ServiceRequest> {
    const response = await apiClient.post<ServiceRequest>(`/service-requests/${id}/reject`, { comments });
    return response.data;
  },

  async updateStatus(id: string, status: string): Promise<ServiceRequest> {
    const response = await apiClient.patch<ServiceRequest>(`/service-requests/${id}/status`, { status });
    return response.data;
  },

  async getHistory(id: string): Promise<ServiceRequestHistoryItem[]> {
    const response = await apiClient.get<ServiceRequestHistoryItem[]>(`/service-requests/${id}/history`);
    return response.data;
  }
};
