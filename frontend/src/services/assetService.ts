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

export interface ChangeBasic {
  id: string;
  change_number: string;
  title: string;
  status: string;
  risk_level: string;
}

export interface AssetMaintenanceItem {
  id: string;
  maintenance_number: string;
  type: string;
  description: string;
  maintenance_date: string;
  result: string;
  next_maintenance_date?: string;
  performed_by?: UserBasic;
}

export interface AssetHistoryItem {
  id: string;
  field_changed: string;
  old_value?: string;
  new_value?: string;
  timestamp: string;
  changed_by?: UserBasic;
}

export interface Asset {
  id: string;
  asset_number: string;
  asset_name: string;
  asset_type: string;
  serial_number?: string;
  hostname?: string;
  ip_address?: string;
  location?: string;
  status: string;
  health: string;
  criticality: string;
  manufacturer?: string;
  model?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  last_maintenance?: string;
  description?: string;
  created_at: string;
  updated_at: string;

  owner?: UserBasic;
  incidents: IncidentBasic[];
  changes: ChangeBasic[];
  maintenances: AssetMaintenanceItem[];
  history: AssetHistoryItem[];
}

export interface CreateAssetInput {
  asset_name: string;
  asset_type: string;
  serial_number?: string;
  hostname?: string;
  ip_address?: string;
  location?: string;
  status?: string;
  health?: string;
  criticality?: string;
  manufacturer?: string;
  model?: string;
  description?: string;
}

export const assetService = {
  listAssets: async (params?: { search?: string; asset_type?: string; health?: string; status?: string; criticality?: string; page?: number }) => {
    const res = await apiClient.get<Asset[]>('/assets', { params });
    return res.data;
  },

  getAsset: async (id: string) => {
    const res = await apiClient.get<Asset>(`/assets/${id}`);
    return res.data;
  },

  createAsset: async (data: CreateAssetInput) => {
    const res = await apiClient.post<Asset>('/assets', data);
    return res.data;
  },

  updateAsset: async (id: string, data: Partial<CreateAssetInput>) => {
    const res = await apiClient.put<Asset>(`/assets/${id}`, data);
    return res.data;
  },

  updateStatus: async (id: string, newStatus: string) => {
    const res = await apiClient.patch<Asset>(`/assets/${id}/status`, null, {
      params: { new_status: newStatus }
    });
    return res.data;
  },

  updateHealth: async (id: string, newHealth: string) => {
    const res = await apiClient.patch<Asset>(`/assets/${id}/health`, null, {
      params: { new_health: newHealth }
    });
    return res.data;
  },

  addMaintenance: async (id: string, data: { type: string; description: string; result?: string }) => {
    const res = await apiClient.post<AssetMaintenanceItem>(`/assets/${id}/maintenance`, data);
    return res.data;
  },

  getIncidents: async (id: string) => {
    const res = await apiClient.get<IncidentBasic[]>(`/assets/${id}/incidents`);
    return res.data;
  },

  getChanges: async (id: string) => {
    const res = await apiClient.get<ChangeBasic[]>(`/assets/${id}/changes`);
    return res.data;
  },

  getHistory: async (id: string) => {
    const res = await apiClient.get<AssetHistoryItem[]>(`/assets/${id}/history`);
    return res.data;
  }
};
