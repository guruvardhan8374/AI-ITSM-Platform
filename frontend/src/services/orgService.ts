import { apiClient } from './api';

export interface PermissionItem {
  id: string;
  name: string;
  module: string;
}

export interface RoleItem {
  id: string;
  name: string;
  description?: string;
  permissions: PermissionItem[];
}

export interface BusinessUnitItem {
  id: string;
  name: string;
  description?: string;
  departments_count: number;
  users_count: number;
}

export interface DepartmentItem {
  id: string;
  name: string;
  business_unit_id?: string;
  business_unit_name?: string;
  teams_count: number;
  users_count: number;
}

export interface TeamItem {
  id: string;
  name: string;
  description?: string;
  department_id?: string;
  department_name?: string;
  lead_name?: string;
  members_count: number;
  open_incidents_count: number;
}

export interface UserItem {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role?: RoleItem;
  department?: DepartmentItem;
  business_unit?: BusinessUnitItem;
  created_at: string;
  last_login?: string;
}

export const orgService = {
  // Users
  listUsers: async (params?: { role_id?: string; department_id?: string; search?: string }) => {
    const res = await apiClient.get<UserItem[]>('/organization/users', { params });
    return res.data;
  },

  createUser: async (data: { email: string; full_name: string; password: string; role_id: string; department_id?: string; business_unit_id?: string }) => {
    const res = await apiClient.post<UserItem>('/organization/users', data);
    return res.data;
  },

  toggleUserStatus: async (id: string) => {
    const res = await apiClient.patch<UserItem>(`/organization/users/${id}/status`);
    return res.data;
  },

  // Roles & Permissions
  listRoles: async () => {
    const res = await apiClient.get<RoleItem[]>('/organization/roles');
    return res.data;
  },

  listPermissions: async () => {
    const res = await apiClient.get<PermissionItem[]>('/organization/permissions');
    return res.data;
  },

  createRole: async (data: { name: string; description?: string; permission_ids?: string[] }) => {
    const res = await apiClient.post<RoleItem>('/organization/roles', data);
    return res.data;
  },

  updateRole: async (id: string, data: { name?: string; description?: string; permission_ids?: string[] }) => {
    const res = await apiClient.put<RoleItem>(`/organization/roles/${id}`, data);
    return res.data;
  },

  // Business Units
  listBusinessUnits: async () => {
    const res = await apiClient.get<BusinessUnitItem[]>('/organization/business-units');
    return res.data;
  },

  createBusinessUnit: async (data: { name: string; description?: string }) => {
    const res = await apiClient.post<BusinessUnitItem>('/organization/business-units', data);
    return res.data;
  },

  // Departments
  listDepartments: async () => {
    const res = await apiClient.get<DepartmentItem[]>('/organization/departments');
    return res.data;
  },

  createDepartment: async (data: { name: string; business_unit_id?: string }) => {
    const res = await apiClient.post<DepartmentItem>('/organization/departments', data);
    return res.data;
  },

  // Support Teams
  listTeams: async () => {
    const res = await apiClient.get<TeamItem[]>('/organization/teams');
    return res.data;
  },

  getTeam: async (id: string) => {
    const res = await apiClient.get<TeamItem>(`/organization/teams/${id}`);
    return res.data;
  },

  createTeam: async (data: { name: string; description?: string; department_id?: string }) => {
    const res = await apiClient.post<TeamItem>('/organization/teams', data);
    return res.data;
  }
};
